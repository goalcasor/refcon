'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CalendarClock, Loader2, Plus, Trash2 } from 'lucide-react';

import { getSafeDb } from '@/lib/firebase/client';
import {
  AGENDA_CONFIG_COLLECTION,
  AGENDA_CONFIG_DOC,
  DEFAULT_AGENDA_CONFIG,
  toDateKey,
  type AgendaConfig,
  type AppointmentMode,
  type Weekday,
} from '@/lib/agenda';
import { getDictionary } from '@/lib/dictionaries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Validación de "HH:mm" y "YYYY-MM-DD".
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formSchema = z.object({
  // 7 booleanos indexados por día (0 = domingo … 6 = sábado).
  weekdays: z.array(z.boolean()).length(7),
  windows: z
    .array(
      z.object({
        start: z.string().regex(timeRegex),
        end: z.string().regex(timeRegex),
      }),
    )
    .min(1),
  slotDurationMinutes: z.coerce.number().int().positive(),
  capacityPerSlot: z.coerce.number().int().positive(),
  leadTimeHours: z.coerce.number().int().min(0),
  horizonDays: z.coerce.number().int().positive(),
  blackoutDates: z.array(z.object({ date: z.string().regex(dateRegex) })),
  modeVisit: z.boolean(),
  modeCall: z.boolean(),
  urgencyEnabled: z.boolean(),
  urgencyMessage: z.string(),
  urgencyUntil: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// Orden de presentación de los días: lunes … domingo (L-D), con su índice real.
const WEEKDAY_ORDER: { day: Weekday; key: string }[] = [
  { day: 1, key: 'mon' },
  { day: 2, key: 'tue' },
  { day: 3, key: 'wed' },
  { day: 4, key: 'thu' },
  { day: 5, key: 'fri' },
  { day: 6, key: 'sat' },
  { day: 0, key: 'sun' },
];

/** AgendaConfig -> valores del formulario. */
function configToForm(config: AgendaConfig): FormValues {
  return {
    weekdays: Array.from({ length: 7 }, (_, i) => config.weekdays.includes(i as Weekday)),
    windows:
      config.windows.length > 0
        ? config.windows.map((w) => ({ start: w.start, end: w.end }))
        : [{ start: '09:00', end: '14:00' }],
    slotDurationMinutes: config.slotDurationMinutes,
    capacityPerSlot: config.capacityPerSlot,
    leadTimeHours: config.leadTimeHours,
    horizonDays: config.horizonDays,
    blackoutDates: config.blackoutDates.map((d) => ({ date: d })),
    modeVisit: config.modes.includes('visit'),
    modeCall: config.modes.includes('call'),
    urgencyEnabled: config.urgency.enabled,
    urgencyMessage: config.urgency.message ?? '',
    urgencyUntil: config.urgency.until ?? '',
  };
}

/** Valores del formulario -> objeto persistible en Firestore. */
function formToConfig(values: FormValues): Omit<AgendaConfig, 'updatedAt'> {
  const weekdays = values.weekdays
    .map((on, i) => (on ? (i as Weekday) : null))
    .filter((v): v is Weekday => v !== null);
  const modes: AppointmentMode[] = [];
  if (values.modeVisit) modes.push('visit');
  if (values.modeCall) modes.push('call');
  return {
    weekdays,
    windows: values.windows.map((w) => ({ start: w.start, end: w.end })),
    slotDurationMinutes: values.slotDurationMinutes,
    capacityPerSlot: values.capacityPerSlot,
    leadTimeHours: values.leadTimeHours,
    horizonDays: values.horizonDays,
    blackoutDates: values.blackoutDates.map((b) => b.date),
    modes,
    urgency: {
      enabled: values.urgencyEnabled,
      message: values.urgencyMessage,
      until: values.urgencyUntil ? values.urgencyUntil : null,
    },
  };
}

export default function AgendaSettingsPage({ params: { locale } }: { params: { locale: any } }) {
  const { toast } = useToast();
  const [t, setT] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: configToForm(DEFAULT_AGENDA_CONFIG),
  });

  const {
    fields: windowFields,
    append: appendWindow,
    remove: removeWindow,
  } = useFieldArray({ control: form.control, name: 'windows' });

  const {
    fields: blackoutFields,
    append: appendBlackout,
    remove: removeBlackout,
  } = useFieldArray({ control: form.control, name: 'blackoutDates' });

  // Diccionario (patrón del mock de pricing: componente cliente con params.locale).
  useEffect(() => {
    getDictionary(locale).then((d) => setT(d.dashboard.agendaSettings));
  }, [locale]);

  // Carga la config real de Firestore; si no existe, usa la de por defecto.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(getSafeDb(), AGENDA_CONFIG_COLLECTION, AGENDA_CONFIG_DOC));
        const config = snap.exists()
          ? ({ ...DEFAULT_AGENDA_CONFIG, ...(snap.data() as Partial<AgendaConfig>) } as AgendaConfig)
          : DEFAULT_AGENDA_CONFIG;
        if (active) form.reset(configToForm(config));
      } catch (err) {
        // Si falla la lectura dejamos los valores por defecto ya cargados.
        console.error('No se pudo cargar la configuración de la agenda:', err);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    setIsSaving(true);
    try {
      const config = formToConfig(values);
      // Persistencia REAL en refcon_agenda_config/default (a diferencia del mock de precios).
      await setDoc(
        doc(getSafeDb(), AGENDA_CONFIG_COLLECTION, AGENDA_CONFIG_DOC),
        { ...config, updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({
        title: t.toast.success.title,
        description: t.toast.success.description,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: t.toast.error.title,
        description: (err as Error).message || t.toast.error.description,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!t || !loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-headline text-3xl font-bold">
          <CalendarClock className="h-7 w-7 text-primary" />
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{t.description}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Días laborables y modalidades */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.sections.schedule}</CardTitle>
            <CardDescription>{t.weekdaysLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4">
              {WEEKDAY_ORDER.map(({ day, key }) => (
                <Controller
                  key={key}
                  control={form.control}
                  name={`weekdays.${day}` as const}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      {t.weekdays[key]}
                    </label>
                  )}
                />
              ))}
            </div>

            <div className="space-y-3">
              <Label>{t.modesLabel}</Label>
              <div className="flex flex-wrap gap-4">
                <Controller
                  control={form.control}
                  name="modeVisit"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      {t.modes.visit}
                    </label>
                  )}
                />
                <Controller
                  control={form.control}
                  name="modeCall"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      {t.modes.call}
                    </label>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Franjas horarias */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.sections.windows}</CardTitle>
            <CardDescription>{t.windowsLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {windowFields.map((f, index) => (
              <div key={f.id} className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`window-start-${index}`}>{t.windowStart}</Label>
                  <Input
                    id={`window-start-${index}`}
                    type="time"
                    className="w-36"
                    {...form.register(`windows.${index}.start` as const)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`window-end-${index}`}>{t.windowEnd}</Label>
                  <Input
                    id={`window-end-${index}`}
                    type="time"
                    className="w-36"
                    {...form.register(`windows.${index}.end` as const)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeWindow(index)}
                  disabled={windowFields.length <= 1}
                  aria-label={t.buttons.remove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendWindow({ start: '16:00', end: '19:00' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.buttons.addWindow}
            </Button>
          </CardContent>
        </Card>

        {/* Límites de reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.sections.limits}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="slotDurationMinutes">{t.slotDurationMinutes}</Label>
              <Input
                id="slotDurationMinutes"
                type="number"
                min={5}
                {...form.register('slotDurationMinutes')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="capacityPerSlot">{t.capacityPerSlot}</Label>
              <Input id="capacityPerSlot" type="number" min={1} {...form.register('capacityPerSlot')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="leadTimeHours">{t.leadTimeHours}</Label>
              <Input id="leadTimeHours" type="number" min={0} {...form.register('leadTimeHours')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="horizonDays">{t.horizonDays}</Label>
              <Input id="horizonDays" type="number" min={1} {...form.register('horizonDays')} />
            </div>
          </CardContent>
        </Card>

        {/* Días cerrados */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.sections.blackout}</CardTitle>
            <CardDescription>{t.blackoutLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {blackoutFields.length === 0 && (
              <p className="text-sm text-muted-foreground">{t.blackoutEmpty}</p>
            )}
            {blackoutFields.map((f, index) => (
              <div key={f.id} className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`blackout-${index}`}>{t.blackoutDate}</Label>
                  <Input
                    id={`blackout-${index}`}
                    type="date"
                    className="w-48"
                    {...form.register(`blackoutDates.${index}.date` as const)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeBlackout(index)}
                  aria-label={t.buttons.remove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendBlackout({ date: toDateKey(new Date()) })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.buttons.addBlackout}
            </Button>
          </CardContent>
        </Card>

        {/* Banner de urgencia */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.sections.urgency}</CardTitle>
            <CardDescription>{t.urgencyLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Controller
              control={form.control}
              name="urgencyEnabled"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="urgencyEnabled" />
                  <Label htmlFor="urgencyEnabled">{t.urgencyEnabled}</Label>
                </div>
              )}
            />
            <div className="space-y-1">
              <Label htmlFor="urgencyMessage">{t.urgencyMessage}</Label>
              <Textarea id="urgencyMessage" rows={2} {...form.register('urgencyMessage')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="urgencyUntil">{t.urgencyUntil}</Label>
              <Input
                id="urgencyUntil"
                type="date"
                className="w-48"
                {...form.register('urgencyUntil')}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? t.buttons.loading : t.buttons.save}
        </Button>
      </form>
    </div>
  );
}
