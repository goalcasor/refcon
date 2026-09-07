'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  CalendarCheck,
  CalendarClock,
  Check,
  Clock,
  Home,
  Loader2,
  MapPin,
  Phone,
  RotateCw,
} from 'lucide-react';

import { getSafeDb } from '@/lib/firebase/client';
import {
  AGENDA_CONFIG_COLLECTION,
  AGENDA_CONFIG_DOC,
  AGENDA_SLOTS_COLLECTION,
  DEFAULT_AGENDA_CONFIG,
  MAIL_COLLECTION,
  SlotFullError,
  availabilityForDate,
  createAppointment,
  formatSlotDate,
  horizonDate,
  isDayOpen,
  toDateKey,
  type AgendaConfig,
  type AppointmentMode,
  type NewAppointmentInput,
  type SlotCounts,
} from '@/lib/agenda';
import { PHONE_DISPLAY, WHATSAPP_URL } from '@/lib/site-config';
import { trackBooking } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type Props = {
  /** Diccionario completo del locale (`getDictionary`). Se usa `t.landing.agenda`. */
  t: any;
  /** Tipo de reforma de la landing de origen, para guardarlo en la cita. */
  renovationType: string;
  /** Slug de la campaña de origen. */
  campaignSlug: string;
  /** Locale activo, para formatear la fecha de la cita. */
  locale: string;
};

/** Escapa lo que teclea el cliente antes de meterlo en el HTML del correo. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Widget de reserva de citas de las landings de campaña.
 *
 * Sustituye al formulario de presupuesto: el visitante reserva una visita técnica
 * gratuita (o una llamada) en un hueco real con aforo. El flujo tiene la mínima
 * fricción posible: modalidad → día → hora → datos, revelando cada paso a medida
 * que el anterior se completa.
 *
 * Toda la lógica de disponibilidad y la transacción anti-overbooking vive en
 * `@/lib/agenda`; aquí solo se pinta el estado en vivo (con `onSnapshot`) y se
 * disparan los dos correos de confirmación al reservar.
 */
export function BookingAgenda({ t, renovationType, campaignSlug, locale }: Props) {
  const tt = t.landing.agenda;
  const { toast } = useToast();

  const [config, setConfig] = useState<AgendaConfig | null>(null);
  const [mode, setMode] = useState<AppointmentMode | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [counts, setCounts] = useState<Record<string, number> | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    dateKey: string;
    time: string;
    mode: AppointmentMode;
    address: string | null;
    phone: string;
  } | null>(null);

  const cfg = config ?? DEFAULT_AGENDA_CONFIG;

  // Config en vivo: si el admin cambia horarios o aforo, la landing se entera.
  useEffect(() => {
    let unsub = () => {};
    try {
      const db = getSafeDb();
      unsub = onSnapshot(
        doc(db, AGENDA_CONFIG_COLLECTION, AGENDA_CONFIG_DOC),
        (snap) => {
          const data = snap.exists() ? (snap.data() as AgendaConfig) : DEFAULT_AGENDA_CONFIG;
          setConfig(data);
          // Si solo hay una modalidad no preguntamos: se fija automáticamente.
          setMode((prev) => prev ?? (data.modes.length === 1 ? data.modes[0] : null));
        },
        () => setConfig(DEFAULT_AGENDA_CONFIG),
      );
    } catch {
      setConfig(DEFAULT_AGENDA_CONFIG);
    }
    return () => unsub();
  }, []);

  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null;

  // Contadores en vivo del día elegido: para pintar los huecos libres reales y
  // que dos personas no vean disponible el mismo último hueco.
  useEffect(() => {
    setCounts(undefined);
    if (!selectedDateKey) return;
    let unsub = () => {};
    try {
      const db = getSafeDb();
      unsub = onSnapshot(
        doc(db, AGENDA_SLOTS_COLLECTION, selectedDateKey),
        (snap) => {
          const data = snap.exists() ? (snap.data() as SlotCounts) : undefined;
          setCounts(data?.counts ?? {});
        },
        () => setCounts({}),
      );
    } catch {
      setCounts({});
    }
    return () => unsub();
  }, [selectedDateKey]);

  const slots = useMemo(() => {
    if (!selectedDateKey) return [];
    return availabilityForDate(cfg, selectedDateKey, counts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, selectedDateKey, counts]);

  // Días no seleccionables en el calendario: anteriores a hoy, más allá del
  // horizonte o cerrados (no laborable / bloqueado).
  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = horizonDate(cfg);
    return (date: Date) => date < today || date > maxDate || !isDayOpen(cfg, date);
  }, [cfg]);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: tt.errors.name }),
        email: z.string().email({ message: tt.errors.email }),
        phone: z.string().min(9, { message: tt.errors.phone }),
        address: z.string().optional(),
        notes: z.string().optional(),
      }),
    [tt],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', notes: '' },
  });

  function handleSelectDate(date: Date | undefined) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  async function onSubmit(values: FormValues) {
    if (!selectedDateKey || !selectedTime || !mode) return;

    // La dirección solo es obligatoria en la visita a domicilio.
    const address = values.address?.trim() ?? '';
    if (mode === 'visit' && address.length < 5) {
      form.setError('address', { message: tt.errors.address });
      return;
    }

    setSubmitting(true);
    const db = getSafeDb();
    const input: NewAppointmentInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      mode,
      address: mode === 'visit' ? address : null,
      date: selectedDateKey,
      time: selectedTime,
      renovationType,
      campaignSlug,
      notes: values.notes?.trim() || null,
    };

    try {
      await createAppointment(db, input, cfg.capacityPerSlot);

      // Correos de confirmación (extensión Trigger Email de Firebase).
      const dateText = formatSlotDate(selectedDateKey, locale);
      const modeLabel = mode === 'visit' ? tt.modes.visit.title : tt.modes.call.title;
      const contactLine =
        mode === 'visit'
          ? `${tt.confirmation.addressLabel}: ${esc(address)}`
          : `${tt.confirmation.phoneLabel}: ${esc(input.phone)}`;

      // Plantilla de email con la marca (tabla + estilos inline: es lo único
      // fiable en clientes de correo). Cabecera verde con el logo blanco.
      const LOGO_WHITE =
        'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Flogo-BLANCO.png?alt=media&token=024ad364-d87c-4aca-8e33-6699425c28c2';
      const emailShell = (inner: string) => `
        <div style="margin:0;padding:0;background:#f4f5f2;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f2;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
            <tr><td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8e3;">
                <tr><td style="background:#123d2e;padding:24px;text-align:center;">
                  <img src="${LOGO_WHITE}" alt="Refcon" width="150" style="display:inline-block;max-width:150px;height:auto;" />
                </td></tr>
                <tr><td style="padding:28px 28px 8px;color:#1f2937;font-size:15px;line-height:1.6;">${inner}</td></tr>
                <tr><td style="background:#0f2f24;padding:18px 28px;color:#cbd5cf;font-size:12px;line-height:1.6;text-align:center;">
                  <strong style="color:#ffffff;">Refcon</strong> · Constructores de sueños<br/>
                  ${PHONE_DISPLAY} · <a href="${WHATSAPP_URL}" style="color:#e9c46a;text-decoration:none;">WhatsApp</a> · refconmallorca.es
                </td></tr>
              </table>
            </td></tr>
          </table>
        </div>`;
      const goldButton = (href: string, label: string) =>
        `<a href="${href}" style="display:inline-block;background:#c8a24b;color:#123d2e;font-weight:bold;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px;">${label}</a>`;
      const detailsCard = (rows: string) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f2;border-radius:10px;margin:0 0 20px;"><tr><td style="padding:16px 18px;color:#1f2937;font-size:15px;line-height:1.7;">${rows}</td></tr></table>`;

      // Textos del botón de gestión, localizados (fuera del dict para no ampliar
      // los 4 JSON solo por esto).
      const EMAIL_TXT: Record<string, { manageBtn: string; manageText: string; manageMsg: string }> = {
        es: {
          manageBtn: 'Cancelar o cambiar la hora',
          manageText: '¿No te viene bien? Cambia o cancela tu cita en un momento:',
          manageMsg: 'Hola, quiero cancelar o cambiar la hora de mi cita del {date} a las {time}.',
        },
        en: {
          manageBtn: 'Cancel or reschedule',
          manageText: "Can't make it? Change or cancel your appointment in a moment:",
          manageMsg: 'Hi, I would like to cancel or reschedule my appointment on {date} at {time}.',
        },
        de: {
          manageBtn: 'Termin ändern oder absagen',
          manageText: 'Passt es nicht? Ändern oder stornieren Sie Ihren Termin ganz schnell:',
          manageMsg: 'Hallo, ich möchte meinen Termin am {date} um {time} Uhr ändern oder absagen.',
        },
        ca: {
          manageBtn: "Cancel·lar o canviar l'hora",
          manageText: 'No et va bé? Canvia o cancel·la la teva cita en un moment:',
          manageMsg: "Hola, vull cancel·lar o canviar l'hora de la meva cita del {date} a les {time}.",
        },
      };
      const el = EMAIL_TXT[locale] ?? EMAIL_TXT.es;
      const waManage = `${WHATSAPP_URL}?text=${encodeURIComponent(
        el.manageMsg.replace('{date}', dateText).replace('{time}', selectedTime),
      )}`;

      // 1) Al cliente, en su idioma.
      await addDoc(collection(db, MAIL_COLLECTION), {
        to: [input.email],
        message: {
          subject: tt.email.clientSubject,
          html: emailShell(`
            <h1 style="margin:0 0 8px;font-size:22px;color:#123d2e;">${esc(tt.confirmation.title)}</h1>
            <p style="margin:0 0 18px;">${esc(tt.email.clientIntro)}</p>
            ${detailsCard(`
              <strong>${esc(tt.confirmation.dateLabel)}:</strong> ${esc(dateText)}<br/>
              <strong>${esc(tt.confirmation.timeLabel)}:</strong> ${esc(selectedTime)}<br/>
              <strong>${esc(tt.confirmation.modeLabel)}:</strong> ${esc(modeLabel)}<br/>
              <strong>${contactLine}</strong>
            `)}
            <p style="margin:0 0 22px;">${esc(tt.email.whatExpect)}</p>
            <p style="margin:0 0 12px;color:#4b5563;">${esc(el.manageText)}</p>
            <p style="margin:0 0 20px;">${goldButton(waManage, esc(el.manageBtn))}</p>
          `),
        },
      });

      // 2) Al admin, en español (operativo), con la misma marca.
      const adminEmail = process.env.NEXT_PUBLIC_LEADS_EMAIL || 'goalcasor@gmail.com';
      await addDoc(collection(db, MAIL_COLLECTION), {
        to: [adminEmail],
        message: {
          subject: `Nueva cita reservada · ${esc(modeLabel)} · ${esc(dateText)} ${esc(selectedTime)}`,
          html: emailShell(`
            <h1 style="margin:0 0 8px;font-size:22px;color:#123d2e;">Nueva cita reservada</h1>
            <p style="margin:0 0 18px;">Se ha reservado una cita desde una landing de campaña.</p>
            ${detailsCard(`
              <strong>Fecha:</strong> ${esc(dateText)}<br/>
              <strong>Hora:</strong> ${esc(selectedTime)}<br/>
              <strong>Modalidad:</strong> ${esc(modeLabel)}${input.address ? `<br/><strong>Dirección:</strong> ${esc(input.address)}` : ''}
            `)}
            ${detailsCard(`
              <strong>Cliente:</strong> ${esc(input.name)}<br/>
              <strong>Email:</strong> <a href="mailto:${esc(input.email)}">${esc(input.email)}</a><br/>
              <strong>Teléfono:</strong> <a href="tel:${esc(input.phone)}">${esc(input.phone)}</a>${input.notes ? `<br/><strong>Comentarios:</strong> ${esc(input.notes)}` : ''}
            `)}
            ${detailsCard(`
              <strong>Campaña:</strong> ${esc(campaignSlug)}<br/>
              <strong>Tipo de reforma:</strong> ${esc(renovationType)}
            `)}
            <p style="margin:0 0 20px;">${goldButton(`tel:${esc(input.phone)}`, 'Llamar al cliente')}</p>
          `),
        },
      });

      trackBooking({ mode, renovationType, campaignSlug });

      setConfirmed({
        dateKey: selectedDateKey,
        time: selectedTime,
        mode,
        address: input.address ?? null,
        phone: input.phone,
      });
      toast({ title: tt.toastSuccess.title, description: tt.toastSuccess.description });
    } catch (error) {
      if (error instanceof SlotFullError) {
        // El hueco se ocupó entre que se pintó y se envió: los contadores en vivo
        // ya se refrescan solos vía onSnapshot; solo hay que deseleccionar la hora.
        setSelectedTime(null);
        toast({
          variant: 'destructive',
          title: tt.errors.slotTaken.title,
          description: tt.errors.slotTaken.description,
        });
      } else {
        console.error(error);
        toast({
          variant: 'destructive',
          title: tt.errors.generic.title,
          description: tt.errors.generic.description,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleRestart() {
    form.reset();
    setSelectedDate(undefined);
    setSelectedTime(null);
    setConfirmed(null);
    setMode(cfg.modes.length === 1 ? cfg.modes[0] : null);
  }

  // ---- Pantalla de confirmación ----
  if (confirmed) {
    const dateText = formatSlotDate(confirmed.dateKey, locale);
    const modeLabel = confirmed.mode === 'visit' ? tt.modes.visit.title : tt.modes.call.title;
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-primary/30 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-fit rounded-full bg-primary/10 p-4">
              <CalendarCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">{tt.confirmation.title}</CardTitle>
            <CardDescription className="text-lg">{tt.confirmation.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mx-auto max-w-sm space-y-2 text-left text-sm">
              <li className="flex justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">{tt.confirmation.dateLabel}</span>
                <span className="font-semibold capitalize">{dateText}</span>
              </li>
              <li className="flex justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">{tt.confirmation.timeLabel}</span>
                <span className="font-semibold">{confirmed.time}</span>
              </li>
              <li className="flex justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">{tt.confirmation.modeLabel}</span>
                <span className="font-semibold">{modeLabel}</span>
              </li>
              {confirmed.mode === 'visit' && confirmed.address && (
                <li className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-muted-foreground">{tt.confirmation.addressLabel}</span>
                  <span className="font-semibold">{confirmed.address}</span>
                </li>
              )}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              {tt.confirmation.doubts.replace('{phone}', PHONE_DISPLAY)}
            </p>
            <Button variant="outline" className="mt-6" onClick={handleRestart}>
              <RotateCw className="mr-2 h-4 w-4" />
              {tt.confirmation.restart}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showModePicker = cfg.modes.length > 1;
  const showAddress = mode === 'visit';

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardContent className="space-y-8 pt-6">
          {/* Paso 1 · Modalidad (solo si hay más de una) */}
          {showModePicker && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-gold">
                  1
                </span>
                {tt.steps.mode}
              </h3>
              <RadioGroup
                value={mode ?? undefined}
                onValueChange={(value) => setMode(value as AppointmentMode)}
                className="grid gap-3 sm:grid-cols-2"
              >
                {cfg.modes.map((m) => {
                  const Icon = m === 'visit' ? Home : Phone;
                  const info = m === 'visit' ? tt.modes.visit : tt.modes.call;
                  const active = mode === m;
                  return (
                    <label
                      key={m}
                      htmlFor={`mode-${m}`}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                        active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-secondary/50',
                      )}
                    >
                      <RadioGroupItem value={m} id={`mode-${m}`} className="mt-1" />
                      <div>
                        <p className="flex items-center gap-2 font-semibold">
                          <Icon className="h-4 w-4 text-primary" />
                          {info.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* Paso 2 · Día */}
          <div className={cn(!showModePicker && mode == null && 'opacity-100')}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-gold">
                {showModePicker ? 2 : 1}
              </span>
              {tt.steps.date}
            </h3>
            <div className="flex justify-center rounded-lg border bg-background p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={disabledDays}
                fromDate={new Date()}
                toDate={horizonDate(cfg)}
              />
            </div>
          </div>

          {/* Paso 3 · Hora */}
          {selectedDateKey && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-gold">
                  {showModePicker ? 3 : 2}
                </span>
                <Clock className="h-4 w-4 text-primary" />
                {tt.steps.time}
              </h3>
              {slots.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {tt.slots.none}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((slot) => {
                    const active = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.full}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          'flex flex-col items-center rounded-md border px-2 py-2 text-sm font-semibold transition-colors',
                          slot.full && 'cursor-not-allowed opacity-40',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:border-primary hover:bg-primary/5',
                        )}
                      >
                        {slot.time}
                        <span className="text-[0.65rem] font-normal opacity-80">
                          {slot.full
                            ? tt.slots.full
                            : tt.slots.remaining.replace('{count}', String(slot.remaining))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Paso 4 · Datos de contacto */}
          {selectedDateKey && selectedTime && mode && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-gold">
                  {showModePicker ? 4 : 3}
                </span>
                {tt.steps.details}
              </h3>

              {/* Resumen de lo elegido, para que quede claro antes de confirmar. */}
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-secondary/50 p-3 text-sm">
                <span className="flex items-center gap-1.5 font-medium capitalize">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {formatSlotDate(selectedDateKey, locale)} · {selectedTime}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  {mode === 'visit' ? <Home className="h-4 w-4 text-primary" /> : <Phone className="h-4 w-4 text-primary" />}
                  {mode === 'visit' ? tt.modes.visit.title : tt.modes.call.title}
                </span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tt.fields.name.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={tt.fields.name.placeholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tt.fields.phone.label}</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder={tt.fields.phone.placeholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className={cn(!showAddress && 'sm:col-span-2')}>
                          <FormLabel>{tt.fields.email.label}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={tt.fields.email.placeholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {showAddress && (
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {tt.fields.address.label}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={tt.fields.address.placeholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tt.fields.notes.label}</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder={tt.fields.notes.placeholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full bg-forest font-bold text-white hover:bg-forest-light"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tt.submitting}
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {tt.submit}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
