import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (Next lo sirve en /manifest.webmanifest e inyecta el
 * <link rel="manifest"> automáticamente). Es lo que hace la web instalable
 * como PWA: nombre, iconos 192/512 (+ maskable), display standalone y colores.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Refcon · Panel',
    short_name: 'Refcon',
    description:
      'Panel de gestión de Refcon: agenda de citas y solicitudes de presupuesto.',
    // La app instalada es la herramienta privada de Refcon: abre en el panel.
    // Sin sesión, el panel redirige a /login (única vía de acceso; el sitio
    // público no muestra ningún enlace a login/dashboard).
    start_url: '/es/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f4f5f2',
    theme_color: '#123d2e',
    lang: 'es',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
