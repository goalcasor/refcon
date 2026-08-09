
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { ArrowLeft, Check, Loader2, MailCheck, RotateCw, Star } from 'lucide-react';
import Link from 'next/link';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getSafeDb } from '@/lib/firebase/client';
import { trackLead } from '@/lib/analytics';

const pricingConfig = {
    integral: { basic: 400, medium: 600, premium: 800 },
    bathrooms: { basic: 1100, medium: 1250, premium: 1750 },
    kitchen: { basic: 621, medium: 700, premium: 760 },
};

export type RenovationType = 'integral' | 'bathrooms' | 'kitchen' | 'pool';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  phone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
  address: z.string().min(5, { message: 'La dirección del proyecto es necesaria.' }),
  // Franja horaria en la que el cliente prefiere recibir la llamada de seguimiento.
  // Lleva valor por defecto para no añadir fricción: quien no elija, envía igual.
  callPreference: z.enum(['morning', 'midday', 'afternoon', 'any']),
  renovationType: z.enum(['integral', 'bathrooms', 'kitchen', 'pool']),
  squareMeters: z.coerce.number().min(1, 'La superficie debe ser de al menos 1 m²'),
  quality: z.enum(['basic', 'medium', 'premium']),
});

type QuickFormValues = z.infer<typeof formSchema>;

export function QuickBudgetForm({
  t,
  defaultRenovationType = 'kitchen',
}: {
  t: any;
  /** Permite a las landings de campaña llegar con el tipo de reforma ya seleccionado. */
  defaultRenovationType?: RenovationType;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [calculatedBudget, setCalculatedBudget] = useState<number | null>(null);

  const form = useForm<QuickFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      callPreference: 'any',
      renovationType: defaultRenovationType,
      squareMeters: 1,
      quality: 'basic',
    },
  });

  const watchRenovationType = form.watch('renovationType');
  const tInclusions = t.budgetRequest.reformInclusions;
  const inclusionItems = tInclusions[watchRenovationType] || [];


  async function handleFormSubmit(values: QuickFormValues) {
    setIsLoading(true);
    try {
      let budget = null;
      if (values.renovationType !== 'pool') {
        const prices = pricingConfig[values.renovationType as keyof typeof pricingConfig];
        budget = values.squareMeters * prices[values.quality as keyof typeof prices];
        setCalculatedBudget(budget);
      }
      
      const db = getSafeDb();

      const renovationLabel = t.budgetRequest.quickForm.renovationType.options[values.renovationType];
      const callPreferenceLabel = t.budgetRequest.quickForm.callPreference.options[values.callPreference];

      // Persist the budget request in the Refcon collection (all Refcon data is prefixed with "refcon_").
      const budgetCollection = collection(db, 'refcon_budget');
      await addDoc(budgetCollection, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        callPreference: values.callPreference,
        renovationType: values.renovationType,
        squareMeters: values.squareMeters,
        quality: values.renovationType !== 'pool' ? values.quality : null,
        estimatedBudget: budget,
        source: 'quick-budget-form',
        status: 'new',
        createdAt: serverTimestamp(),
      });

      const mailCollection = collection(db, 'mail');

      const recipientEmail = process.env.NEXT_PUBLIC_LEADS_EMAIL || 'goalcasor@gmail.com';
      // La franja horaria va en el asunto para poder priorizar la bandeja sin abrir el correo.
      const subject = `Nuevo lead · ${renovationLabel} · Llamar: ${callPreferenceLabel}`;

      await addDoc(mailCollection, {
        to: [recipientEmail],
        message: {
            subject: subject,
            html: `
                <h1>Nueva Solicitud de Presupuesto Rápido</h1>
                <p>Se ha recibido una nueva solicitud de presupuesto a través del formulario rápido de la web.</p>
                <h2>Detalles del Cliente:</h2>
                <ul>
                    <li><strong>Nombre:</strong> ${values.name}</li>
                    <li><strong>Email:</strong> ${values.email}</li>
                    <li><strong>Teléfono:</strong> ${values.phone}</li>
                    <li><strong>Prefiere que le llamen:</strong> ${callPreferenceLabel}</li>
                    <li><strong>Dirección:</strong> ${values.address}</li>
                </ul>
                <h2>Detalles del Proyecto:</h2>
                <ul>
                    <li><strong>Tipo de Reforma:</strong> ${renovationLabel}</li>
                    <li><strong>Metros Cuadrados:</strong> ${values.squareMeters} m²</li>
                    ${values.renovationType !== 'pool' ? `<li><strong>Calidad:</strong> ${t.budgetRequest.form.quality.options[values.quality]}</li>` : ''}
                </ul>
                <h2>Presupuesto Estimado:</h2>
                <p style="font-size: 24px; font-weight: bold;">
                    ${budget ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(budget) : 'A consultar (Piscina)'}
                </p>
                <p>Por favor, ponte en contacto con el cliente para dar seguimiento.</p>
            `,
        },
      });

      // Conversión principal de la campaña. Se envía el importe estimado como valor
      // para poder optimizar por tamaño de proyecto, no solo por número de leads.
      trackLead({
        value: budget,
        renovationType: values.renovationType,
        callPreference: values.callPreference,
      });

      toast({
        title: t.budgetRequest.form.toast.success.title,
        description: t.budgetRequest.form.toast.success.description,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.budgetRequest.form.toast.error.title,
        description: t.budgetRequest.form.toast.error.description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleRestart = () => {
    form.reset();
    setIsSubmitted(false);
    setCalculatedBudget(null);
  }
  
  if (isSubmitted) {
    const isPool = watchRenovationType === 'pool';
    const reviewLink = "https://www.habitissimo.es/pro/refcon";

    return (
        <div className="text-center max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className='mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4'>
                        <MailCheck className='w-12 h-12 text-primary' />
                    </div>
                    <CardTitle className="font-headline text-3xl">{t.budgetRequest.confirmation.title}</CardTitle>
                    <CardDescription className="text-lg">{t.budgetRequest.confirmation.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isPool ? (
                        <p className="text-muted-foreground mt-4">{t.budgetRequest.confirmation.poolMessage}</p>
                    ) : (
                        <>
                            <p className='text-muted-foreground text-lg'>Tu presupuesto estimado es:</p>
                            <p className='font-headline text-4xl font-bold text-primary my-4'>
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(calculatedBudget || 0)}
                            </p>
                            <p className="text-muted-foreground mt-4 text-sm">{t.budgetRequest.confirmation.noCostMessage}</p>
                        </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                        <Button asChild>
                            <a href='/'>{t.budgetRequest.confirmation.button}</a>
                        </Button>
                        <Button variant="outline" onClick={handleRestart}>
                            <RotateCw className="mr-2 h-4 w-4" />
                            {t.budgetRequest.confirmation.restartForm}
                        </Button>
                    </div>
                     <div className="mt-8">
                        <Button asChild variant="secondary">
                            <Link href={reviewLink} target="_blank" rel="noopener noreferrer">
                                <Star className="mr-2 h-4 w-4" />
                                {t.budgetRequest.confirmation.reviewButton}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className='w-full max-w-5xl mx-auto text-left'>
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-2xl text-center'>{t.budgetRequest.quickForm.title}</CardTitle>
          <CardDescription className='text-center'>{t.budgetRequest.quickForm.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>{t.budgetRequest.form.name.label}</FormLabel><FormControl><Input placeholder={t.budgetRequest.form.name.placeholder} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>{t.budgetRequest.form.email.label}</FormLabel><FormControl><Input type="email" placeholder={t.budgetRequest.form.email.placeholder} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>{t.budgetRequest.form.phone.label}</FormLabel><FormControl><Input placeholder={t.budgetRequest.form.phone.placeholder} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="callPreference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.budgetRequest.quickForm.callPreference.label}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="morning">{t.budgetRequest.quickForm.callPreference.options.morning}</SelectItem>
                        <SelectItem value="midday">{t.budgetRequest.quickForm.callPreference.options.midday}</SelectItem>
                        <SelectItem value="afternoon">{t.budgetRequest.quickForm.callPreference.options.afternoon}</SelectItem>
                        <SelectItem value="any">{t.budgetRequest.quickForm.callPreference.options.any}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>{t.budgetRequest.form.address.label}</FormLabel><FormControl><Input placeholder={t.budgetRequest.form.address.placeholder} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className={`grid ${watchRenovationType === 'pool' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                 <FormField control={form.control} name="renovationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.budgetRequest.quickForm.renovationType.label}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="integral">{t.budgetRequest.quickForm.renovationType.options.integral}</SelectItem>
                        <SelectItem value="bathrooms">{t.budgetRequest.quickForm.renovationType.options.bathrooms}</SelectItem>
                        <SelectItem value="kitchen">{t.budgetRequest.quickForm.renovationType.options.kitchen}</SelectItem>
                        <SelectItem value="pool">{t.budgetRequest.quickForm.renovationType.options.pool}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="squareMeters" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.budgetRequest.quickForm.squareMeters.label}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 {watchRenovationType !== 'pool' && (
                    <FormField control={form.control} name="quality" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.budgetRequest.form.quality.label}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t.budgetRequest.form.quality.placeholder} /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="basic">{t.budgetRequest.form.quality.options.basic}</SelectItem>
                                    <SelectItem value="medium">{t.budgetRequest.form.quality.options.medium}</SelectItem>
                                    <SelectItem value="premium">{t.budgetRequest.form.quality.options.premium}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                 )}
              </div>

               {inclusionItems.length > 0 && (
                <div className='p-6 bg-secondary/50 rounded-lg'>
                    <h3 className='font-semibold mb-4 text-center'>{tInclusions.title} {t.budgetRequest.quickForm.renovationType.options[watchRenovationType as keyof typeof t.budgetRequest.quickForm.renovationType.options]}:</h3>
                    <ul className='grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground'>
                        {inclusionItems.map((item: string, index: number) => (
                            <li key={index} className='flex items-start'>
                                <Check className='w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0' />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
               )}
              <div className="flex justify-end items-center gap-4 mt-8">
                <Button type="submit" disabled={isLoading} size="lg" className='w-full sm:w-auto'>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? t.budgetRequest.form.buttons.loading : t.budgetRequest.form.buttons.submit}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
