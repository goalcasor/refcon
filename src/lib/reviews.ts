// src/lib/reviews.ts

/**
 * Opiniones verificadas del perfil de Refcon en Habitissimo.
 *
 * Se publican **extractos entrecomillados**, no la opinión íntegra: es contenido
 * de terceros y reproducirlo completo choca con las condiciones de Habitissimo y
 * con los derechos de sus autores.
 *
 * IMPORTANTE: no generar JSON-LD de `AggregateRating` con estos datos. Google
 * prohíbe el marcado propio de reseñas alojadas en terceros y puede derivar en
 * acción manual. La nota se muestra como texto, siempre con atribución visible.
 *
 * Fuente: https://www.habitissimo.es/pro/refcon/opiniones (consultado 08/2026)
 */

export const HABITISSIMO_RATING = 4.8;
export const HABITISSIMO_REVIEW_COUNT = 124;

export type Review = {
  author: string;
  rating: number;
  /** Antigüedad en años, tal y como la publica Habitissimo. */
  yearsAgo: number;
  quote: string;
  /** Idioma original del texto: permite priorizar el inglés en la landing /en/. */
  lang: 'es' | 'en';
};

export const REVIEWS: Review[] = [
  {
    author: 'Tanit Iglesias',
    rating: 5,
    yearsAgo: 4,
    quote: 'Profesionalidad, formalidad, pulcritud. Un trabajo impecable y un trato excelente.',
    lang: 'es',
  },
  {
    author: 'José Vicente Rubio',
    rating: 5,
    yearsAgo: 3,
    quote: 'El trato de todos muy bueno y se ocupan de tener todo limpio y ordenado. Se cumplen los plazos.',
    lang: 'es',
  },
  {
    author: 'Jose',
    rating: 5,
    yearsAgo: 3,
    quote: 'Rápidos en el presupuesto, que respetaron totalmente. Trabajadores limpios y profesionales.',
    lang: 'es',
  },
  {
    author: 'Stephanie',
    rating: 5,
    yearsAgo: 3,
    quote: 'La paciencia de todo el equipo ha sido infinita, han cumplido con los tiempos.',
    lang: 'es',
  },
  {
    author: 'Pedro Vilajoana',
    rating: 5,
    yearsAgo: 4,
    quote: 'Excelente en la realización del contrato. Excelente pulcritud en la recogida y limpieza.',
    lang: 'es',
  },
  {
    author: 'Carol',
    rating: 5,
    yearsAgo: 4,
    quote: 'Cumplieron con las fechas, calidad-precio muy bien. Buenos profesionales.',
    lang: 'es',
  },
  {
    author: 'Marta',
    rating: 5,
    yearsAgo: 4,
    quote: 'Desde el principio todo fue maravilloso. 100% recomendable para cualquier trabajo.',
    lang: 'es',
  },
  {
    author: 'Avi',
    rating: 5,
    yearsAgo: 3,
    quote: 'They did an excellent job, very attentive and most importantly humane.',
    lang: 'en',
  },
  {
    author: 'Elena Vela',
    rating: 4,
    yearsAgo: 3,
    quote: 'Los trabajadores cumplidores, saben su oficio. Mantienen la obra limpia y ordenada.',
    lang: 'es',
  },
];

/**
 * Ordena poniendo delante las del idioma de la página, para que la landing en
 * inglés abra con la opinión en inglés.
 */
export function reviewsForLocale(locale: string, limit = 8): Review[] {
  const preferred = locale === 'en' ? 'en' : 'es';
  return [...REVIEWS]
    .sort((a, b) => Number(b.lang === preferred) - Number(a.lang === preferred))
    .slice(0, limit);
}
