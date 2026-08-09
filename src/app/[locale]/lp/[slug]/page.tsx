import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Phone, Star } from 'lucide-react';

import { getDictionary } from '@/lib/dictionaries';
import { landingPages, landingSlugs, type LandingSlug } from '@/lib/landing-pages';
import { QuickBudgetForm } from '@/components/budget-request/quick-budget-form';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PHONE = '+34661959090';

type Props = { params: { locale: string; slug: string } };

export const dynamicParams = false;

// Solo devuelve el parámetro de este segmento: Next lo combina con los `locale`
// que ya genera el layout raíz.
export function generateStaticParams() {
  return landingSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  if (!landingSlugs.includes(slug as LandingSlug)) return {};

  const dict = await getDictionary(locale as any);
  const page = dict.landing.pages[slug];

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    // Las landings de campaña no se indexan: evitan canibalizar el SEO de /services/.
    robots: { index: false, follow: false },
  };
}

export default async function LandingPage({ params: { locale, slug } }: Props) {
  if (!landingSlugs.includes(slug as LandingSlug)) {
    notFound();
  }

  const config = landingPages[slug as LandingSlug];
  const dict = await getDictionary(locale as any);
  const t = dict.landing;
  const page = t.pages[slug];
  const inclusions: string[] = dict.budgetRequest.reformInclusions[config.inclusionsKey] ?? [];

  const testimonials = [
    { quote: dict.home.testimonials.testimonial2, name: dict.home.testimonials.customer2 },
    { quote: dict.home.testimonials.testimonial3, name: dict.home.testimonials.customer3 },
  ];

  const trustPoints = [t.trust.years, t.trust.written, t.trust.noCost, t.trust.callback];

  return (
    <>
      {/*
        Cabecera reducida a propósito: sin menú de navegación. En una landing de
        campaña, cada enlace que no sea el formulario es una fuga de conversión.
      */}
      <header className="w-full border-b bg-background">
        <div className="container-limited flex h-16 items-center justify-between">
          <Logo width={110} height={36} />
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${PHONE}`}>
              <Phone className="mr-2 h-4 w-4" />
              661 95 90 90
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full bg-secondary/50 py-14 md:py-20">
          <div className="container-limited">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
                {page.h1}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                {page.subtitle}
              </p>
              <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-center text-sm font-medium">
                    <Check className="mr-2 h-4 w-4 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* El formulario va inmediatamente después del titular: es el objetivo de la página. */}
        <section className="w-full bg-background py-14 md:py-20">
          <div className="container-limited">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold">{t.formTitle}</h2>
              <p className="mt-3 text-muted-foreground">{t.formSubtitle}</p>
            </div>
            <QuickBudgetForm t={dict} defaultRenovationType={config.renovationType} />
          </div>
        </section>

        {inclusions.length > 0 && (
          <section className="w-full bg-secondary/50 py-14 md:py-20">
            <div className="container-limited max-w-4xl">
              <h2 className="text-center font-headline text-3xl font-bold">
                {t.inclusionsTitle}
              </h2>
              <ul className="mt-8 grid gap-x-8 gap-y-3 md:grid-cols-2">
                {inclusions.map((item) => (
                  <li key={item} className="flex items-start text-sm text-muted-foreground">
                    <Check className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="w-full bg-background py-14 md:py-20">
          <div className="container-limited max-w-4xl">
            <h2 className="text-center font-headline text-3xl font-bold">{t.galleryTitle}</h2>
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl shadow-lg">
              {config.media.type === 'video' ? (
                // preload="none" para no penalizar el LCP: el objetivo es el formulario.
                <video
                  src={config.media.src}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : (
                <Image
                  src={config.media.src}
                  alt={page.h1}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              )}
            </div>
          </div>
        </section>

        <section className="w-full bg-secondary/50 py-14 md:py-20">
          <div className="container-limited max-w-4xl">
            <h2 className="text-center font-headline text-3xl font-bold">
              {t.testimonialsTitle}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <Card key={item.name} className="border-none bg-background shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {item.quote}
                    </p>
                    <p className="mt-4 font-semibold">{item.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-background py-8">
        <div className="container-limited flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Refcon</p>
          <div className="flex gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-foreground">
              {dict.legal.privacy.title}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-foreground">
              {dict.legal.terms.title}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
