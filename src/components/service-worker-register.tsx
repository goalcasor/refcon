'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker (/sw.js) en el cliente. Necesario para que la web
 * sea instalable como PWA en Android/Chromium y funcione offline básico.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Espera a que la página cargue para no competir con recursos críticos.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
