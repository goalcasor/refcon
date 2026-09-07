'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { AlarmClock } from 'lucide-react';

import { getSafeDb } from '@/lib/firebase/client';
import {
  AGENDA_CONFIG_COLLECTION,
  AGENDA_CONFIG_DOC,
  type AgendaConfig,
  type AgendaUrgency,
} from '@/lib/agenda';

/**
 * Banner de urgencia/escasez de la promoción, bajo el header de la landing.
 *
 * Lee `config.urgency` en vivo (`onSnapshot`): así el admin puede encender o
 * apagar el mensaje sin tocar código. Se oculta por completo si no está activado.
 *
 * Arranca con el mensaje de respaldo (localizado) para no dejar un hueco vacío
 * mientras llega el snapshot; si el admin lo tiene desactivado, desaparece en
 * cuanto se resuelve la lectura.
 */
export function PromoUrgencyBanner({ fallbackMessage }: { fallbackMessage?: string }) {
  const [urgency, setUrgency] = useState<AgendaUrgency>({
    enabled: true,
    message: fallbackMessage ?? '',
    until: null,
  });

  useEffect(() => {
    let unsub = () => {};
    try {
      const db = getSafeDb();
      unsub = onSnapshot(
        doc(db, AGENDA_CONFIG_COLLECTION, AGENDA_CONFIG_DOC),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as AgendaConfig;
          if (data.urgency) setUrgency(data.urgency);
        },
        () => {},
      );
    } catch {
      // Sin Firebase (SSR/config incompleta) se queda con el mensaje de respaldo.
    }
    return () => unsub();
  }, []);

  if (!urgency.enabled) return null;
  const message = urgency.message || fallbackMessage;
  if (!message) return null;

  return (
    <div className="w-full bg-gradient-to-r from-gold to-gold-light text-forest">
      <div className="container-limited flex items-center justify-center gap-2 py-2 text-center text-xs font-bold uppercase tracking-wide sm:text-sm">
        <AlarmClock className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
