'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PHONE, WHATSAPP_URL } from '@/lib/site-config';
import { trackPhoneClick, trackWhatsappClick } from '@/lib/analytics';

/**
 * Botones de llamada y WhatsApp con medición incorporada.
 *
 * Las landings son componentes de servidor y no pueden llevar `onClick`, así que
 * sin esto los dos CTA principales de la página no se registrarían. El contenido
 * (icono y texto) llega como `children` desde la página.
 */
type CtaProps = {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function CallButton({ children, className, size = 'lg' }: CtaProps) {
  return (
    <Button asChild size={size} className={className}>
      <a href={`tel:${PHONE}`} onClick={trackPhoneClick}>
        {children}
      </a>
    </Button>
  );
}

export function WhatsappButton({ children, className, size = 'lg' }: CtaProps) {
  return (
    <Button asChild size={size} className={className}>
      <a
        href={WHATSAPP_URL}
        onClick={trackWhatsappClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    </Button>
  );
}
