'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getSafeDb } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  message: z.string().min(10, { message: 'Cuéntanos un poco más sobre tu consulta.' }),
});

type ContactFormValues = z.infer<typeof formSchema>;

export function ContactForm({ t }: { t: any }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsLoading(true);
    try {
      const db = getSafeDb();

      // Misma convención que el resto de datos de Refcon: prefijo "refcon_".
      await addDoc(collection(db, 'refcon_contact'), {
        ...values,
        source: 'contact-form',
        status: 'new',
        createdAt: serverTimestamp(),
      });

      const recipientEmail = process.env.NEXT_PUBLIC_LEADS_EMAIL || 'goalcasor@gmail.com';
      await addDoc(collection(db, 'mail'), {
        to: [recipientEmail],
        message: {
          subject: `Nuevo mensaje de contacto · ${values.name}`,
          html: `
            <h1>Nuevo mensaje desde el formulario de contacto</h1>
            <ul>
              <li><strong>Nombre:</strong> ${values.name}</li>
              <li><strong>Email:</strong> ${values.email}</li>
            </ul>
            <h2>Mensaje:</h2>
            <p>${values.message}</p>
          `,
        },
      });

      // Conversión secundaria: captura el contacto, pero sin los datos de
      // cualificación del formulario de presupuesto.
      trackEvent('contact_form_submit');

      toast({ title: t.toast.success.title, description: t.toast.success.description });
      form.reset();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t.toast.error.title,
        description: t.toast.error.description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.form.name}</FormLabel>
            <FormControl><Input placeholder={t.form.namePlaceholder} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.form.email}</FormLabel>
            <FormControl><Input type="email" placeholder={t.form.emailPlaceholder} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.form.message}</FormLabel>
            <FormControl>
              <Textarea placeholder={t.form.messagePlaceholder} className="min-h-[150px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.form.button}
        </Button>
      </form>
    </Form>
  );
}
