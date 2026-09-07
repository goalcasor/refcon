import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';

/**
 * robots.txt. Se permite todo el sitio público y se bloquea el panel privado y
 * las pantallas de acceso. Las landings `/lp` NO se bloquean aquí: llevan
 * `noindex` en su metadata y conviene que el buscador pueda leerlo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/dashboard', '/*/login', '/*/signup'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
