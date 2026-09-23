'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toDateKey, type Appointment, type AppointmentStatus } from '@/lib/agenda';

/** Colores de las citas por estado dentro del calendario. */
const CHIP: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  confirmed: 'bg-primary/15 text-primary',
  completed: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
  no_show: 'bg-destructive/15 text-destructive',
};
const DOT: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-primary',
  completed: 'bg-emerald-600',
  cancelled: 'bg-muted-foreground/50',
  no_show: 'bg-destructive',
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/**
 * Calendario mensual con las citas dentro de cada día (estilo agenda), no un
 * simple date-picker. Escritorio: chips con hora + nombre. Móvil: puntos por
 * estado. Al pulsar un día se selecciona (el detalle se muestra fuera).
 */
export function MonthCalendar({
  appointments,
  selectedDate,
  onSelectDate,
  locale,
  todayLabel = 'Hoy',
  moreLabel = 'más',
}: {
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  locale: string;
  todayLabel?: string;
  moreLabel?: string;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(selectedDate));

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      if (!a.date) continue;
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    for (const list of map.values()) list.sort((x, y) => (x.time ?? '').localeCompare(y.time ?? ''));
    return map;
  }, [appointments]);

  // Rejilla de 6 semanas empezando en lunes.
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i);
      return { date, inMonth: date.getMonth() === cursor.getMonth() };
    });
  }, [cursor]);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2024-01-01 fue lunes.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  const pick = (date: Date, inMonth: boolean) => {
    if (!inMonth) setCursor(startOfMonth(date));
    onSelectDate(date);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Cabecera con mes y navegación */}
      <div className="flex items-center justify-between gap-2 p-3">
        <h2 className="text-base font-semibold capitalize md:text-lg">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              setCursor(startOfMonth(now));
              onSelectDate(now);
            }}
          >
            {todayLabel}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 border-y bg-muted/30 text-center text-[0.7rem] font-medium uppercase text-muted-foreground">
        {weekdays.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* Rejilla */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const appts = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(date, inMonth)}
              className={cn(
                'flex min-h-[58px] flex-col items-stretch gap-1 border-b border-r p-1 text-left transition-colors last:border-r-0 md:min-h-[104px] md:p-1.5',
                'hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday && 'bg-primary font-bold text-primary-foreground',
                  )}
                >
                  {date.getDate()}
                </span>
                {appts.length > 0 && (
                  <span className="text-[0.6rem] font-medium text-muted-foreground md:hidden">
                    {appts.length}
                  </span>
                )}
              </div>

              {/* Chips (escritorio) */}
              <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
                {appts.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className={cn('truncate rounded px-1 py-0.5 text-[0.65rem] font-medium', CHIP[(a.status ?? 'pending') as AppointmentStatus])}
                  >
                    {a.time} · {a.name || '—'}
                  </span>
                ))}
                {appts.length > 3 && (
                  <span className="px-1 text-[0.6rem] text-muted-foreground">
                    +{appts.length - 3} {moreLabel}
                  </span>
                )}
              </div>

              {/* Puntos (móvil) */}
              {appts.length > 0 && (
                <div className="flex flex-wrap gap-0.5 md:hidden">
                  {appts.slice(0, 4).map((a) => (
                    <span key={a.id} className={cn('h-1.5 w-1.5 rounded-full', DOT[(a.status ?? 'pending') as AppointmentStatus])} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
