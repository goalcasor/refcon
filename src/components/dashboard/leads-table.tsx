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
import { AlertCircle, Clock, Euro, Inbox, Mail, MapPin, Phone } from 'lucide-react';

import { getSafeDb } from '@/lib/firebase/client';
import {
  BUDGET_COLLECTION,
  LEAD_STATUSES,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  type BudgetLead,
  type LeadStatus,
} from '@/lib/leads';
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

export function LeadsTable({ t, tBudget, locale }: { t: any; tBudget: any; locale: string }) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<BudgetLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      // onSnapshot en lugar de una lectura puntual: el propietario suele tener
      // esta pantalla abierta mientras la campaña corre, y así entran solas.
      const q = query(collection(getSafeDb(), BUDGET_COLLECTION), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BudgetLead));
          setError(null);
        },
        (err) => setError(err.message)
      );
    } catch (err) {
      setError((err as Error).message);
    }
    return () => unsubscribe();
  }, []);

  const visible = useMemo(
    () => (leads ?? []).filter((l) => filter === 'all' || (l.status ?? 'new') === filter),
    [leads, filter]
  );

  const stats = useMemo(() => {
    const all = leads ?? [];
    return {
      total: all.length,
      fresh: all.filter((l) => (l.status ?? 'new') === 'new').length,
      won: all.filter((l) => l.status === 'won').length,
      pipeline: all
        .filter((l) => l.status !== 'lost')
        .reduce((sum, l) => sum + (l.estimatedBudget ?? 0), 0),
    };
  }, [leads]);

  async function changeStatus(id: string, status: LeadStatus) {
    try {
      await updateDoc(doc(getSafeDb(), BUDGET_COLLECTION, id), { status });
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

  if (leads === null) {
    return <p className="text-muted-foreground">{t.loading}</p>;
  }

  const summary = [
    { label: t.stats.total, value: String(stats.total), icon: Inbox },
    { label: t.stats.fresh, value: String(stats.fresh), icon: Clock },
    { label: t.stats.won, value: String(stats.won), icon: Mail },
    { label: t.stats.pipeline, value: formatCurrency(stats.pipeline, locale), icon: Euro },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        {LEAD_STATUSES.map((s) => (
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
        <div className="space-y-4">
          {visible.map((lead) => {
            const status = (lead.status ?? 'new') as LeadStatus;
            return (
              <Card key={lead.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-bold">{lead.name || '—'}</p>
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            STATUS_STYLES[status]
                          )}
                        >
                          {t.status[status]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(lead.createdAt, locale)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </a>
                        )}
                        {lead.address && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {lead.address}
                          </span>
                        )}
                      </div>

                      <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <Field
                          label={t.fields.renovationType}
                          value={
                            lead.renovationType
                              ? (tBudget.quickForm.renovationType.options[lead.renovationType] ??
                                lead.renovationType)
                              : '—'
                          }
                        />
                        <Field
                          label={t.fields.callPreference}
                          value={
                            lead.callPreference
                              ? (tBudget.quickForm.callPreference.options[lead.callPreference] ??
                                lead.callPreference)
                              : '—'
                          }
                          highlight
                        />
                        <Field
                          label={t.fields.squareMeters}
                          value={lead.squareMeters ? `${lead.squareMeters} m²` : '—'}
                        />
                        <Field
                          label={t.fields.quality}
                          value={
                            lead.quality
                              ? (tBudget.form.quality.options[lead.quality] ?? lead.quality)
                              : '—'
                          }
                        />
                      </dl>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:w-56 lg:items-end">
                      <div className="lg:text-right">
                        <p className="text-xs text-muted-foreground">{t.fields.estimatedBudget}</p>
                        <p className="font-headline text-2xl font-bold text-primary">
                          {formatCurrency(lead.estimatedBudget, locale)}
                        </p>
                      </div>
                      <Select
                        value={status}
                        onValueChange={(v) => changeStatus(lead.id, v as LeadStatus)}
                      >
                        <SelectTrigger className="w-full lg:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
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
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium', highlight && 'text-primary')}>{value}</dd>
    </div>
  );
}
