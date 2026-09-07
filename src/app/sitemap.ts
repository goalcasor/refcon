import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';
import { services } from '@/lib/services';
import { blogPosts } from '@/lib/blog-posts';
import { landingSlugs } from '@/lib/landing-pages';

/**
 * Sitemap dinámico de las páginas PÚBLICAS indexables, en los 4 idiomas y con
 * hreflang (alternates). Las landings de campaña `/lp` van `noindex` y NO se
 * incluyen; tampoco el panel privado, login/signup.
 */
const LOCALES = ['es', 'en', 'de', 'ca'] as const;
const DEFAULT_LOCALE = 'es';

type Entry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
};

function publicPaths(): Entry[] {
  const list: Entry[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/budget-request', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  ];
  for (const s of services) {
    list.push({ path: `/services/${s.id}`, priority: 0.8, changeFrequency: 'monthly' });
  }
  for (const p of blogPosts) {
    list.push({ path: `/blog/${p.slug}`, priority: 0.6, changeFrequency: 'monthly' });
  }
  // Landings de oferta: páginas comerciales con precio, indexables (prioridad alta).
  for (const slug of landingSlugs) {
    list.push({ path: `/lp/${slug}`, priority: 0.9, changeFrequency: 'monthly' });
  }
  return list;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicPaths().flatMap(({ path, priority, changeFrequency }) => {
    const languages: Record<string, string> = {};
    for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}${path}`;
    languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;
    return LOCALES.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
