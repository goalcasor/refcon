'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

/**
 * En la app INSTALADA (modo standalone), si el usuario ya tiene sesión, al abrir
 * en la home lo lleva directamente al dashboard —UX de app nativa—. En el
 * navegador normal no hace nada, así que la home pública se ve igual.
 */
export function PwaAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari (PWA en pantalla de inicio)
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    const locale = pathname.split('/')[1] || 'es';
    // Solo desde la home (punto de entrada de la PWA).
    if (pathname === `/${locale}` || pathname === '/') {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, loading, pathname, router]);

  return null;
}
