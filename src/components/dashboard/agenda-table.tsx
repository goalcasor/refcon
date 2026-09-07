'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Video,
} from 'lucide-react';

import { getSafeDb } from '@/lib/firebase/client';
import {
  APPOINTMENTS_COLLECTION,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_STYLES,
  adjustSlotCount,
  formatAppointmentCreatedAt,
  formatSlotDate,
  slotDeltaForStatusChange,
  toDateKey,
  type Appointment,
  type AppointmentStatus,
} from '@/lib/agenda';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Tabla de la agenda de citas reservadas desde las landings.
 * Espejo de `leads-table.tsx`: escucha en tiempo real, muestra stats, filtra
 * por estado y permite cambiar el estado de cada cita. Agrupa por fecha para
 * que el propietario vea de un vistazo las próximas visitas/llamadas.
 */
export function AgendaTable({ t, locale }: { t: any; locale: string }) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      // onSnapshot: el propietario tiene esta pantalla abierta durante la
      // campaña y las citas entran solas, sin recargar.
      const q = query(
        collection(getSafeDb(), APPOINTMENTS_COLLECTION),
        orderBy('date', 'asc'),
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment));
          setError(null);
        },
        (err) => setError(err.message),
      );
    } catch (err) {
      setError((err as Error).message);
    }
    return () => unsubscribe();
  }, []);

  const visible = useMemo(
    () => (appointments ?? []).filter((a) => filter === 'all' || (a.status ?? 'pending') === filter),
    [appointments, filter],
  );

  // Agrupa las citas visibles por fecha (próximas primero) y ordena por hora.
  const groups = useMemo(() => {
    const byDate = new Map<string, Appointment[]>();
    for (const app of visible) {
      const list = byDate.get(app.date) ?? [];
      list.push(app);
      byDate.set(app.date, list);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        items: items.slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
      }));
  }, [visible]);

  const stats = useMemo(() => {
    const all = appointments ?? [];
    const now = new Date();
    const todayKey = toDateKey(now);
    // Lunes de la semana actual … domingo (comparación léxica sobre YYYY-MM-DD).
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = toDateKey(monday);
    const weekEnd = toDateKey(sunday);
    return {
      total: all.length,
      today: all.filter((a) => a.date === todayKey).length,
      thisWeek: all.filter((a) => a.date >= weekStart && a.date <= weekEnd).length,
      pending: all.filter((a) => (a.status ?? 'pending') === 'pending').length,
      confirmed: all.filter((a) => a.status === 'confirmed').length,
    };
  }, [appointments]);

  async function changeStatus(id: string, status: AppointmentStatus) {
    const appt = (appointments ?? []).find((a) => a.id === id);
    const prev = (appt?.status ?? 'pending') as AppointmentStatus;
    try {
      const db = getSafeDb();
      await updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), { status });
      // Libera el hueco al cancelar/no presentar (o lo vuelve a ocupar si se
      // reactiva). Sin esto una cita cancelada bloquearía la plaza para siempre.
      const delta = slotDeltaForStatusChange(prev, status);
      if (delta && appt?.date && appt?.time) {
        await adjustSlotCount(db, appt.date, appt.time, delta);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t.statusError,
        description: (err as Error).message,
      });
    }
  }

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {t.errorTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{t.errorHelp}</p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{error}</pre>
        </CardContent>
      </Card>
    );
  }

  if (appointments === null) {
    return <p className="text-muted-foreground">{t.loading}</p>;
  }

  const summary = [
    { label: t.stats.total, value: String(stats.total), icon: CalendarDays },
    { label: t.stats.today, value: String(stats.today), icon: CalendarCheck },
    { label: t.stats.thisWeek, value: String(stats.thisWeek), icon: CalendarClock },
    { label: t.stats.pending, value: String(stats.pending), icon: Clock },
    { label: t.stats.confirmed, value: String(stats.confirmed), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          {t.filters.all} ({stats.total})
        </Button>
        {APPOINTMENT_STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => setFilter(s)}
          >
            {t.status[s]}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">{t.empty}</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(({ date, items }) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold capitalize">{formatSlotDate(date, locale)}</h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-4">
                {items.map((app) => (
                  <AppointmentCard
                    key={app.id}
                    app={app}
                    t={t}
                    locale={locale}
                    onChangeStatus={changeStatus}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  app,
  t,
  locale,
  onChangeStatus,
}: {
  app: Appointment;
  t: any;
  locale: string;
  onChangeStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const status = (app.status ?? 'pending') as AppointmentStatus;
  const isVisit = app.mode === 'visit';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-bold">{app.name || '—'}</p>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  isVisit
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >
                {isVisit ? <MapPin className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                {isVisit ? t.modes.visit : t.modes.call}
              </span>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  APPOINTMENT_STATUS_STYLES[status],
                )}
              >
                {t.status[status]}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="capitalize">{formatSlotDate(app.date, locale)}</span>
              <span className="text-muted-foreground">·</span>
              <span>{app.time}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {app.phone && (
                <a
                  href={`tel:${app.phone}`}
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {app.phone}
                </a>
              )}
              {app.email && (
                <a
                  href={`mailto:${app.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {app.email}
                </a>
              )}
              {isVisit && app.address && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {app.address}
                </span>
              )}
            </div>

            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t.fields.renovationType} value={app.renovationType || '—'} />
              <Field label={t.fields.campaign} value={app.campaignSlug || '—'} />
              <Field
                label={t.fields.createdAt}
                value={formatAppointmentCreatedAt(app.createdAt, locale)}
              />
            </dl>

            {app.notes && (
              <div className="mt-4">
                <dt className="text-xs text-muted-foreground">{t.fields.notes}</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
                  {app.notes}
                </dd>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:w-56 lg:items-end">
            <Select value={status} onValueChange={(v) => onChangeStatus(app.id, v as AppointmentStatus)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t.status[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
