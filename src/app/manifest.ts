import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (Next lo sirve en /manifest.webmanifest e inyecta el
 * <link rel="manifest"> automáticamente). Es lo que hace la web instalable
 * como PWA: nombre, iconos 192/512 (+ maskable), display standalone y colores.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Refcon · Reformas y Construcción en Mallorca',
    short_name: 'Refcon',
    description:
      'Reformas, construcción y piscinas en Mallorca. Precio cerrado y presupuesto sin compromiso.',
    start_url: '/es',
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
