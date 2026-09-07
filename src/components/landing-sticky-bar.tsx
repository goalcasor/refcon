'use client';

import Link from 'next/link';
import { CalendarClock, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { PHONE, WHATSAPP_URL } from '@/lib/site-config';
import { trackPhoneClick, trackWhatsappClick } from '@/lib/analytics';

/**
 * Barra fija inferior en móvil.
 *
 * Llamada y WhatsApp ocupan el peso visual; la reserva de cita queda como acción
 * secundaria en icono. En una landing larga el CTA del hero deja de verse en
 * cuanto se baja a leer, y esta barra evita tener que volver arriba.
 *
 * Solo en móvil: en escritorio restaría espacio útil.
 */
export function LandingStickyBar({
  t,
}: {
  t: { quote: string; reserve?: string; call: string; whatsapp: string };
}) {
  // `reserve` es la clave nueva; `quote` se mantiene como respaldo por si algún
  // locale aún no la trae.
  const reserveLabel = t.reserve ?? t.quote;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-background/95 p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <Button asChild className="h-11 flex-1 bg-forest font-bold text-white hover:bg-forest-light">
          <a href={`tel:${PHONE}`} onClick={trackPhoneClick}>
            <Phone className="mr-2 h-4 w-4 text-gold" />
            {t.call}
          </a>
        </Button>
        <Button asChild className="h-11 flex-1 bg-[#25D366] font-bold text-white hover:bg-[#1FB855]">
          <a
            href={WHATSAPP_URL}
            onClick={trackWhatsappClick}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp className="mr-2 h-4 w-4" />
            {t.whatsapp}
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 border-forest/25"
          aria-label={reserveLabel}
        >
          <Link href="#reservar">
            <CalendarClock className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
