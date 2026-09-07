import {
  Timestamp,
  type Firestore,
  runTransaction,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Agenda de citas de las landings de campaña.
 *
 * Sustituye al formulario de presupuesto en las páginas `/lp`: el visitante
 * reserva una **visita técnica gratuita** o una **llamada** en un hueco real
 * con aforo, en lugar de pedir un presupuesto (las ofertas ya llevan precio
 * cerrado).
 *
 * Firebase es 100% cliente en este proyecto, así que el modelo separa lo
 * público de lo privado para no exponer datos personales:
 *
 *  - `refcon_agenda_config/default` — configuración editable por el admin.
 *    Lectura pública (la landing necesita saber qué huecos ofrecer).
 *  - `refcon_agenda_slots/{YYYY-MM-DD}` — SOLO contadores por hueco, sin ningún
 *    dato personal. Lectura pública; se actualiza dentro de la transacción de
 *    reserva para poder pintar los huecos libres reales.
 *  - `refcon_appointments/{id}` — la cita completa, con nombre/email/teléfono/
 *    dirección. Creación pública (vía transacción); lectura solo para el admin.
 */

export const AGENDA_CONFIG_COLLECTION = 'refcon_agenda_config';
export const AGENDA_CONFIG_DOC = 'default';
export const AGENDA_SLOTS_COLLECTION = 'refcon_agenda_slots';
export const APPOINTMENTS_COLLECTION = 'refcon_appointments';
/** Colección de la extensión "Trigger Email" de Firebase. */
export const MAIL_COLLECTION = 'mail';

/** 0 = domingo … 6 = sábado (igual que `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Modalidad de la cita. La visita a domicilio exige dirección. */
export type AppointmentMode = 'visit' | 'call';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];

/**
 * Estados que "ocupan" un hueco (cuentan para el aforo). Cancelada y no
 * presentado liberan la plaza. Sirve para saber cuándo hay que ajustar el
 * contador al cambiar de estado desde el dashboard.
 */
export const OCCUPYING_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'completed'];

export const occupiesSlot = (status: AppointmentStatus): boolean =>
  OCCUPYING_STATUSES.includes(status);

/** Delta a aplicar al contador del hueco al pasar de un estado a otro (0, +1 o -1). */
export function slotDeltaForStatusChange(
  from: AppointmentStatus,
  to: AppointmentStatus,
): -1 | 0 | 1 {
  const was = occupiesSlot(from);
  const will = occupiesSlot(to);
  if (was === will) return 0;
  return will ? 1 : -1;
}

/** Colores del badge por estado, en la paleta del sitio (mismo criterio que leads). */
export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  confirmed: 'bg-primary/15 text-primary border-primary/30',
  completed: 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground border-border',
  no_show: 'bg-destructive/15 text-destructive border-destructive/30',
};

/** Ventana horaria de un día laborable, en formato "HH:mm". */
export type TimeWindow = { start: string; end: string };

export type AgendaUrgency = {
  enabled: boolean;
  /** Texto del banner de urgencia/escasez de la landing. */
  message: string;
  /** Fecha ISO opcional de fin de la oferta ("YYYY-MM-DD"). */
  until?: string | null;
};

export type AgendaConfig = {
  /** Días de la semana en los que se atienden citas. */
  weekdays: Weekday[];
  /** Ventanas horarias del día (p. ej. mañana y tarde). */
  windows: TimeWindow[];
  /** Duración de cada hueco en minutos. */
  slotDurationMinutes: number;
  /** Aforo: nº máximo de citas por hueco. */
  capacityPerSlot: number;
  /** Antelación mínima en horas para poder reservar un hueco. */
  leadTimeHours: number;
  /** Horizonte: cuántos días vista se pueden reservar. */
  horizonDays: number;
  /** Fechas cerradas puntuales ("YYYY-MM-DD"). */
  blackoutDates: string[];
  /** Modalidades ofrecidas. Si solo hay una, la landing no pregunta. */
  modes: AppointmentMode[];
  /** Banner de urgencia de la promoción. */
  urgency: AgendaUrgency;
  updatedAt?: Timestamp | null;
};

/** Config por defecto: L-V, mañana y tarde, huecos de 1 h, aforo 2, 45 días vista. */
export const DEFAULT_AGENDA_CONFIG: AgendaConfig = {
  weekdays: [1, 2, 3, 4, 5],
  windows: [
    { start: '09:00', end: '14:00' },
    { start: '16:00', end: '19:00' },
  ],
  slotDurationMinutes: 60,
  capacityPerSlot: 2,
  leadTimeHours: 24,
  horizonDays: 45,
  blackoutDates: [],
  modes: ['visit', 'call'],
  urgency: {
    enabled: true,
    message: 'Oferta por tiempo limitado · plazas de instalación limitadas este mes',
    until: null,
  },
};

/** Cita tal y como se guarda en Firestore (sin el id, que es el del documento). */
export type AppointmentData = {
  name: string;
  email: string;
  phone: string;
  mode: AppointmentMode;
  /** Requerida cuando `mode === 'visit'`. */
  address?: string | null;
  /** Día de la cita, "YYYY-MM-DD". */
  date: string;
  /** Hora de inicio del hueco, "HH:mm". */
  time: string;
  /** Tipo de reforma de la landing de origen. */
  renovationType?: string | null;
  /** Slug de la campaña de origen (`reforma-bano`, …). */
  campaignSlug?: string | null;
  /** Nota libre opcional del cliente. */
  notes?: string | null;
  status: AppointmentStatus;
  source: string;
  createdAt?: Timestamp | null;
};

export type Appointment = AppointmentData & { id: string };

/** Datos que aporta el formulario de la landing; el resto los pone la transacción. */
export type NewAppointmentInput = Omit<AppointmentData, 'status' | 'source' | 'createdAt'>;

/** Se lanza cuando el hueco se llenó entre que se pintó y se intentó reservar. */
export class SlotFullError extends Error {
  constructor(
    public readonly date: string,
    public readonly time: string,
  ) {
    super(`El hueco ${date} ${time} está completo.`);
    this.name = 'SlotFullError';
  }
}

/** Documento de contadores de un día. `counts["09:00"] = 2`. */
export type SlotCounts = { counts?: Record<string, number>; updatedAt?: Timestamp | null };

// ---------------------------------------------------------------------------
// Helpers de fecha/hueco (puros, testeables sin Firebase)
// ---------------------------------------------------------------------------

/** Clave local "YYYY-MM-DD" de una fecha (sin desfase de zona horaria de toISOString). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function timeOfMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** ¿Es un día en el que se atienden citas? (día laborable y no bloqueado) */
export function isDayOpen(config: AgendaConfig, date: Date): boolean {
  const wd = date.getDay() as Weekday;
  if (!config.weekdays.includes(wd)) return false;
  return !config.blackoutDates.includes(toDateKey(date));
}

/** Genera todas las horas de hueco de un día, sin mirar disponibilidad. */
export function generateSlotTimes(config: AgendaConfig, date: Date): string[] {
  if (!isDayOpen(config, date)) return [];
  const step = Math.max(config.slotDurationMinutes, 5);
  const times: string[] = [];
  for (const win of config.windows) {
    const end = minutesOf(win.end);
    for (let t = minutesOf(win.start); t + step <= end; t += step) {
      times.push(timeOfMinutes(t));
    }
  }
  return times;
}

/** Momento (Date) de inicio de un hueco. */
export function slotDateTime(dateKey: string, time: string): Date {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** ¿Se puede reservar aún este hueco? (respeta la antelación mínima) */
export function isSlotBookable(
  config: AgendaConfig,
  dateKey: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const start = slotDateTime(dateKey, time).getTime();
  const minStart = now.getTime() + config.leadTimeHours * 3600_000;
  return start >= minStart;
}

/** Última fecha reservable, según el horizonte configurado. */
export function horizonDate(config: AgendaConfig, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + config.horizonDays);
  return d;
}

export type SlotAvailability = { time: string; remaining: number; full: boolean };

/**
 * Huecos de un día con sus plazas libres, ya filtrados por antelación mínima.
 * `counts` es el documento público de contadores de ese día (puede faltar).
 */
export function availabilityForDate(
  config: AgendaConfig,
  dateKey: string,
  counts: Record<string, number> | undefined,
  now: Date = new Date(),
): SlotAvailability[] {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return generateSlotTimes(config, date)
    .filter((time) => isSlotBookable(config, dateKey, time, now))
    .map((time) => {
      const used = Number(counts?.[time] ?? 0);
      const remaining = Math.max(config.capacityPerSlot - used, 0);
      return { time, remaining, full: remaining <= 0 };
    });
}

// ---------------------------------------------------------------------------
// Escritura: reserva con transacción (anti-overbooking honesto)
// ---------------------------------------------------------------------------

/**
 * Crea una cita comprobando el aforo de forma atómica.
 *
 * Lee el contador del hueco y solo crea la cita e incrementa el contador si
 * queda plaza; si no, lanza `SlotFullError`. Al ser una transacción de
 * Firestore, dos reservas simultáneas del último hueco no se pisan.
 *
 * (Endurecer contra un cliente malicioso requeriría una Cloud Function; hoy el
 * proyecto no tiene functions y la seguridad se apoya en las reglas + esta
 * transacción, en línea con el resto del sitio.)
 *
 * @returns el id del documento de cita creado.
 */
export async function createAppointment(
  db: Firestore,
  input: NewAppointmentInput,
  capacityPerSlot: number,
): Promise<string> {
  const slotRef = doc(db, AGENDA_SLOTS_COLLECTION, input.date);
  const apptRef = doc(collection(db, APPOINTMENTS_COLLECTION));

  await runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);
    const counts = (slotSnap.exists() ? (slotSnap.data() as SlotCounts).counts : undefined) ?? {};
    const current = Number(counts[input.time] ?? 0);

    if (current >= capacityPerSlot) {
      throw new SlotFullError(input.date, input.time);
    }

    // merge:true conserva el resto de horas del mismo día.
    tx.set(
      slotRef,
      { counts: { [input.time]: current + 1 }, updatedAt: serverTimestamp() },
      { merge: true },
    );

    // Sin `satisfies AppointmentData`: `serverTimestamp()` es un FieldValue, no
    // un Timestamp, y solo se resuelve a Timestamp en el servidor.
    tx.set(apptRef, {
      ...input,
      address: input.mode === 'visit' ? (input.address ?? null) : null,
      status: 'pending' as AppointmentStatus,
      source: 'landing-agenda',
      createdAt: serverTimestamp(),
    });
  });

  return apptRef.id;
}

/**
 * Ajusta el contador de un hueco de forma atómica (nunca baja de 0).
 *
 * Se usa desde el dashboard cuando una cita cambia de estado: al cancelarla o
 * marcarla como no presentado hay que liberar la plaza (delta -1); si se
 * reactiva, volver a ocuparla (delta +1). Sin esto, una cita cancelada dejaría
 * el hueco bloqueado para siempre.
 */
export async function adjustSlotCount(
  db: Firestore,
  dateKey: string,
  time: string,
  delta: number,
): Promise<void> {
  if (!delta || !dateKey || !time) return;
  const slotRef = doc(db, AGENDA_SLOTS_COLLECTION, dateKey);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(slotRef);
    const counts = (snap.exists() ? (snap.data() as SlotCounts).counts : undefined) ?? {};
    const current = Number(counts[time] ?? 0);
    const next = Math.max(0, current + delta);
    tx.set(slotRef, { counts: { [time]: next }, updatedAt: serverTimestamp() }, { merge: true });
  });
}

// ---------------------------------------------------------------------------
// Formateo para pantalla
// ---------------------------------------------------------------------------

export function formatSlotDate(dateKey: string, locale: string): string {
  const [y, mo, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-DE' : 'es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(y, mo - 1, d));
}

/** `serverTimestamp()` llega como null en la lectura inmediata tras escribir. */
export function formatAppointmentCreatedAt(value: Timestamp | null | undefined, locale: string) {
  if (!value?.toDate) return '—';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value.toDate());
}
