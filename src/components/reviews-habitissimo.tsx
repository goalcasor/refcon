'use client';

import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { HABITISSIMO_RATING, HABITISSIMO_REVIEW_COUNT, reviewsForLocale } from '@/lib/reviews';
import { HABITISSIMO_REVIEWS_URL } from '@/lib/site-config';
import { trackHabitissimoClick } from '@/lib/analytics';

function Stars({ rating, gold = false }: { rating: number; gold?: boolean }) {
  const filled = gold ? 'fill-gold text-gold' : 'fill-primary text-primary';
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? filled : 'text-muted-foreground/25'}`} />
      ))}
    </div>
  );
}

/**
 * Prueba social verificada de Habitissimo.
 *
 * Se publican extractos con atribución, nunca la opinión íntegra, y **sin
 * JSON-LD de AggregateRating**: Google prohíbe el marcado propio de reseñas
 * alojadas en terceros.
 *
 * El enlace de salida es texto discreto y no botón, a propósito: manda a un
 * marketplace donde también están los competidores, y el visitante ha costado
 * dinero. El único botón de esta sección debe ser el CTA que va debajo.
 */
export function ReviewsHabitissimo({
  locale,
  t,
  limit = 8,
}: {
  locale: string;
  t: any;
  limit?: number;
}) {
  const reviews = reviewsForLocale(locale, limit);
  const rating = HABITISSIMO_RATING.toLocaleString('es-ES', { minimumFractionDigits: 1 });

  return (
    <div className="container-limited">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight md:text-4xl">
          {t.title}
        </h2>
        <span className="mx-auto mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-gold to-gold-light" />

        {/* Bloque de nota en verde bosque y dorado, como el sello del folleto. */}
        <div className="mx-auto mt-8 inline-flex items-center gap-5 rounded-2xl bg-forest px-7 py-5 shadow-xl">
          <p className="font-headline text-5xl font-extrabold leading-none text-gold">{rating}</p>
          <div className="text-left">
            <Stars rating={5} gold />
            <p className="mt-1.5 text-sm font-semibold text-white">
              {t.count.replace('{count}', String(HABITISSIMO_REVIEW_COUNT))}
            </p>
            <p className="text-xs text-white/55">{t.verified}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reviews.map((review) => (
          <Card
            key={review.author}
            className="border-none bg-background shadow-lg ring-1 ring-forest/5 transition-shadow hover:shadow-xl"
          >
            <CardContent className="flex h-full flex-col pt-6">
              <Stars rating={review.rating} gold />
              <p className="mt-4 flex-1 font-accent text-sm italic leading-relaxed text-muted-foreground">
                &laquo;{review.quote}&raquo;
              </p>
              {/*
                No se muestra la antigüedad a propósito: las opiniones tienen
                3-4 años y datarlas resta credibilidad sin aportar nada. El dato
                sigue en reviews.ts y es comprobable en el enlace de abajo.
              */}
              <p className="mt-5 text-sm font-bold">{review.author}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm">
        <a
          href={HABITISSIMO_REVIEWS_URL}
          onClick={trackHabitissimoClick}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t.seeAll.replace('{count}', String(HABITISSIMO_REVIEW_COUNT))}
        </a>
      </p>
    </div>
  );
}
