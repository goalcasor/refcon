import type { Timestamp } from 'firebase/firestore';

/**
 * Solicitudes de presupuesto recibidas desde la web.
 *
 * Es lo que escribe `QuickBudgetForm` en la colección `refcon_budget`. El
 * formulario ya guardaba todo esto; hasta ahora solo se consultaba por correo o
 * entrando en la consola de Firebase.
 */

export const BUDGET_COLLECTION = 'refcon_budget';
export const CONTACT_COLLECTION = 'refcon_contact';

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];

/** Colores del badge por estado, en la paleta del sitio. */
export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-primary/15 text-primary border-primary/30',
  contacted: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400',
  quoted: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  won: 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30 dark:text-emerald-400',
  lost: 'bg-muted text-muted-foreground border-border',
};

export type BudgetLead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  callPreference?: 'morning' | 'midday' | 'afternoon' | 'any';
  renovationType?: string;
  squareMeters?: number | null;
  quality?: 'basic' | 'medium' | 'premium' | null;
  estimatedBudget?: number | null;
  source?: string;
  status?: LeadStatus;
  createdAt?: Timestamp | null;
};

export type ContactLead = {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  status?: LeadStatus;
  createdAt?: Timestamp | null;
};

/** `serverTimestamp()` llega como null en la lectura inmediata tras escribir. */
export function formatDate(value: Timestamp | null | undefined, locale: string) {
  if (!value?.toDate) return '—';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value.toDate());
}

export function formatCurrency(value: number | null | undefined, locale: string) {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    useGrouping: 'always',
  }).format(value);
}
