import type { Appointment } from '@/lib/agenda';

/**
 * Enlaces de calendario para una cita: URL de "Añadir a Google Calendar" y un
 * archivo .ics (estándar, válido para Apple/Outlook/Google). Con VALARM para
 * que el propio calendario del cliente/admin recuerde la cita.
 *
 * Se usan horas "flotantes" (sin zona): el calendario las interpreta en la
 * hora local del dispositivo, suficiente para un negocio local en Mallorca.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYYMMDDTHHMMSS" en hora local, sumando minutos opcionales. */
function stamp(dateKey: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, mi + addMinutes);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function modeLabel(a: Appointment): string {
  return a.mode === 'visit' ? 'Visita a domicilio' : 'Llamada';
}

function title(a: Appointment): string {
  return `Cita Refcon · ${modeLabel(a)}${a.name ? ` · ${a.name}` : ''}`;
}

function description(a: Appointment): string {
  return [
    a.name && `Cliente: ${a.name}`,
    a.phone && `Teléfono: ${a.phone}`,
    a.email && `Email: ${a.email}`,
    a.renovationType && `Reforma: ${a.renovationType}`,
    a.notes && `Notas: ${a.notes}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** "Añadir a Google Calendar" (abre el evento prerrellenado). */
export function googleCalendarUrl(a: Appointment, durationMinutes = 60): string {
  const dates = `${stamp(a.date, a.time)}/${stamp(a.date, a.time, durationMinutes)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title(a),
    dates,
    details: description(a),
    ctz: 'Europe/Madrid',
  });
  if (a.mode === 'visit' && a.address) params.set('location', a.address);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const escICS = (s: string) =>
  String(s || '')
    .replace(/([\\,;])/g, '\\$1')
    .replace(/\n/g, '\\n');

/** Contenido de un archivo .ics con recordatorio 2 h antes. */
export function buildICS(a: Appointment, durationMinutes = 60): string {
  const start = stamp(a.date, a.time);
  const end = stamp(a.date, a.time, durationMinutes);
  const uid = `${a.id || `${a.date}-${a.time}`}@refconmallorca.es`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Refcon//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escICS(title(a))}`,
    `DESCRIPTION:${escICS(description(a))}`,
    a.mode === 'visit' && a.address ? `LOCATION:${escICS(a.address)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio · Cita Refcon',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

/** `data:` URI para descargar el .ics desde un enlace <a download>. */
export function icsDataUri(a: Appointment, durationMinutes = 60): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildICS(a, durationMinutes))}`;
}
