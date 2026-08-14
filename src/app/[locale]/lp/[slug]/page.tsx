import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Check, Clock, Gem, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

import { getDictionary } from '@/lib/dictionaries';
import {
  landingPages,
  landingSlugs,
  formatOfferAmount,
  offerPriceSuffix,
  type LandingSlug,
} from '@/lib/landing-pages';
import { PHONE, PHONE_DISPLAY, WHATSAPP_URL } from '@/lib/site-config';
import { QuickBudgetForm } from '@/components/budget-request/quick-budget-form';
import { ReviewsHabitissimo } from '@/components/reviews-habitissimo';
import { FeaturedProjects } from '@/components/featured-projects';
import { LandingStickyBar } from '@/components/landing-sticky-bar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { CallButton, WhatsappButton } from '@/components/cta-buttons';

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
  const url = `/${locale}/lp/${slug}`;
  const ogImage = landingPages[slug as LandingSlug].ogImage;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    // Las landings de campaña no se indexan: evitan canibalizar el SEO de /services/.
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    /*
      Open Graph propio de cada oferta. Sin esto se hereda entero el del layout
      raíz y las cinco landings se ven idénticas al compartirlas por WhatsApp.
      La imagen la genera opengraph-image.tsx con el precio de cada una.
    */
    openGraph: {
      type: 'website',
      url,
      siteName: 'Refcon',
      title: page.h1,
      description: page.subtitle,
      locale: locale === 'en' ? 'en_GB' : locale === 'de' ? 'de_DE' : 'es_ES',
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: page.h1 }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.h1,
      description: page.subtitle,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

const BENEFIT_ICONS = [Clock, Gem, UserCheck, BadgeCheck, ShieldCheck];

/** Encabezado de sección con el filete dorado del folleto. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="font-headline text-3xl font-extrabold tracking-tight md:text-4xl">{children}</h2>
      <span className="mx-auto mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-gold to-gold-light" />
    </div>
  );
}

export default async function LandingPage({ params: { locale, slug } }: Props) {
  if (!landingSlugs.includes(slug as LandingSlug)) {
    notFound();
  }

  const config = landingPages[slug as LandingSlug];
  const dict = await getDictionary(locale as any);
  const t = dict.landing;
  const page = t.pages[slug];
  const amount = formatOfferAmount(config, locale);
  const suffix = offerPriceSuffix(config);

  // El acento va siempre al final del titular, en cursiva serif.
  const [h1Lead] = page.h1Accent ? page.h1.split(page.h1Accent) : [page.h1];

  const seals = [t.offer.seals.fixedPrice, t.offer.seals.noSurprises, t.offer.seals.warranty];
  const trustPoints = [t.trust.years, t.trust.written, t.trust.noCost, t.trust.callback];

  return (
    <>
      {/*
        Cabecera reducida a propósito: sin menú de navegación. En una landing de
        campaña, cada enlace que no sea el formulario es una fuga de conversión.
      */}
      <header className="w-full border-b border-gold/20 bg-background">
        <div className="container-limited flex h-16 items-center justify-between">
          <Logo width={110} height={36} />
          <CallButton size="sm" className="bg-forest font-bold text-white hover:bg-forest-light">
              <Phone className="mr-2 h-4 w-4 text-gold" />
              <span className="hidden sm:inline">{t.offer.ctaSecondary} · </span>
              {PHONE_DISPLAY}
            </CallButton>
        </div>
      </header>

      {/* pb-24 en móvil deja hueco para la barra fija inferior. */}
      <main className="flex-1 pb-24 md:pb-0">
        <section className="w-full bg-secondary/50 py-12 md:py-20">
          <div className="container-limited grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-forest px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                {t.offer.badge}
              </span>
              <h1 className="mt-5 font-headline text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                {h1Lead.trim()}{' '}
                <em className="block font-accent text-[0.85em] font-medium italic text-primary">
                  {page.h1Accent}
                </em>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {page.subtitle}
              </p>
              <ul className="mt-7 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start text-sm font-medium">
                    <span className="mr-2.5 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Panel de oferta en verde bosque y dorado, replicando la creatividad.
              Colores de marca fijos: no cambian con el tema claro/oscuro.
            */}
            <div className="overflow-hidden rounded-2xl bg-forest shadow-2xl ring-1 ring-gold/25">
              <div className="bg-gradient-to-b from-forest-light to-forest px-7 pb-8 pt-7 text-center md:px-9">
                <p className="gold-rule text-[0.7rem] font-bold uppercase tracking-[0.22em] text-gold">
                  {t.offer.badge}
                </p>

                <p className="mt-6 text-sm font-medium uppercase tracking-[0.14em] text-white/60">
                  {page.priceLabel}
                </p>
                <p className="mt-1 font-headline text-6xl font-extrabold leading-none text-white md:text-7xl">
                  {amount}
                  <span className="text-gold">€</span>
                  {suffix && <span className="text-3xl font-bold text-white/70 md:text-4xl">{suffix}</span>}
                </p>

                <p className="mt-5 inline-block rounded-md bg-gradient-to-r from-gold to-gold-light px-5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-forest shadow-lg">
                  {t.offer.vat}
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-7">
                  {seals.map((seal) => (
                    <div key={seal} className="flex flex-col items-center gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50">
                        <ShieldCheck className="h-5 w-5 text-gold" />
                      </span>
                      <span className="text-[0.68rem] font-bold uppercase leading-tight tracking-wide text-white/85">
                        {seal}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-7 text-sm text-white/70">
                  {t.offer.termLabel}: <span className="font-bold text-gold">{page.term}</span>
                </p>
              </div>

              {/* Llamada y WhatsApp por delante; el presupuesto queda como enlace. */}
              <div className="space-y-3 bg-forest px-7 pb-7 md:px-9">
                <CallButton className="w-full bg-gradient-to-r from-gold to-gold-light text-base font-extrabold text-forest shadow-lg hover:from-gold-light hover:to-gold">
                    <Phone className="mr-2 h-5 w-5" />
                    {t.offer.ctaSecondary} · {PHONE_DISPLAY}
                  </CallButton>
                <WhatsappButton className="w-full bg-[#25D366] text-base font-bold text-white hover:bg-[#1FB855]">
                    <FaWhatsapp className="mr-2 h-5 w-5" />
                    {t.offer.ctaWhatsapp}
                  </WhatsappButton>
                <p className="pt-1 text-center">
                  <Link
                    href="#presupuesto"
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-gold"
                  >
                    {t.offer.ctaQuoteLink}
                  </Link>
                </p>
                <p className="text-center text-[0.7rem] leading-relaxed text-white/45">
                  {t.offer.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-background py-16 md:py-24">
          <div className="container-limited max-w-4xl">
            <SectionHeading>{t.includesTitle}</SectionHeading>
            <ul className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-2">
              {page.includes.map((item: string) => (
                <li key={item} className="flex items-start text-sm">
                  <span className="mr-3 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mismo patrón que "Nuestro Método de Trabajo" de la home: tarjeta con
            borde, número en esquina e icono, aquí con la paleta de campaña. */}
        <section className="w-full bg-secondary/40 py-16 md:py-24">
          <div className="container-limited max-w-6xl">
            <SectionHeading>{t.benefitsTitle}</SectionHeading>
            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {t.benefits.map((benefit: { title: string; description: string }, i: number) => {
                const Icon = BENEFIT_ICONS[i] ?? Check;
                return (
                  <div
                    key={benefit.title}
                    className="relative flex flex-col items-center rounded-lg border bg-background p-6 text-center shadow-sm"
                  >
                    <div className="absolute -right-2 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-gold shadow-md">
                      {i + 1}
                    </div>
                    <Icon className="mb-4 h-10 w-10 text-primary" />
                    <h3 className="mb-2 font-headline text-lg font-bold">{benefit.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mismo mosaico que "Proyectos que Inspiran" de la home. Su tarjeta de
            CTA apunta al formulario de esta página, no a /budget-request. */}
        <section className="w-full bg-secondary py-16 md:py-24">
          <div className="container-limited">
            <SectionHeading>{dict.home.projects.title}</SectionHeading>
            <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-muted-foreground">
              {dict.home.projects.subtitle}
            </p>
            <div className="mt-12">
              <FeaturedProjects t={dict.home.projects} ctaHref="#presupuesto" />
            </div>
          </div>
        </section>

        <section className="w-full bg-background py-16 md:py-24">
          <ReviewsHabitissimo locale={locale} t={t.reviews} />
        </section>

        {/* CTA justo tras la prueba social, que es el pico de persuasión. */}
        <section className="w-full bg-forest py-16 md:py-24">
          <div className="container-limited max-w-2xl text-center">
            <p className="gold-rule mx-auto max-w-xs text-[0.7rem] font-bold uppercase tracking-[0.22em] text-gold">
              Refcon
            </p>
            <h2 className="mt-6 font-headline text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              {t.finalCta.title}
            </h2>
            <p className="mt-4 leading-relaxed text-white/70">{t.finalCta.subtitle}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CallButton className="bg-gradient-to-r from-gold to-gold-light text-base font-extrabold text-forest shadow-lg hover:from-gold-light hover:to-gold">
                  <Phone className="mr-2 h-5 w-5" />
                  {PHONE_DISPLAY}
                </CallButton>
              <WhatsappButton className="bg-[#25D366] text-base font-bold text-white hover:bg-[#1FB855]">
                  <FaWhatsapp className="mr-2 h-5 w-5" />
                  {t.offer.ctaWhatsapp}
                </WhatsappButton>
            </div>
          </div>
        </section>

        {/*
          El formulario cierra la página, en segundo plano respecto a llamada y
          WhatsApp: es la vía para quien prefiere escribir o quiere el importe
          antes de hablar con nadie.
        */}
        <section id="presupuesto" className="w-full scroll-mt-16 bg-secondary/40 py-16 md:py-24">
          <div className="container-limited">
            <div className="mx-auto mb-12 max-w-2xl">
              <SectionHeading>{t.formTitle}</SectionHeading>
              <p className="mt-5 text-center leading-relaxed text-muted-foreground">
                {t.formSubtitle}
              </p>
            </div>
            <QuickBudgetForm t={dict} defaultRenovationType={config.renovationType} />
          </div>
        </section>
      </main>

      <LandingStickyBar t={t.stickyBar} />

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
