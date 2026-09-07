import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Gem,
  KeyRound,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

import { getDictionary } from '@/lib/dictionaries';
import {
  landingPages,
  landingSlugs,
  formatOfferAmount,
  offerPriceSuffix,
  type LandingSlug,
} from '@/lib/landing-pages';
import { PHONE, PHONE_DISPLAY, WHATSAPP_URL, SITE_URL } from '@/lib/site-config';
import placeholderImages from '@/lib/placeholder-images.json';
import { BookingAgenda } from '@/components/agenda/booking-agenda';
import { PromoUrgencyBanner } from '@/components/agenda/promo-urgency-banner';
import { ReviewsHabitissimo } from '@/components/reviews-habitissimo';
import { FeaturedProjects } from '@/components/featured-projects';
import { LandingStickyBar } from '@/components/landing-sticky-bar';
import { GuaranteeBadge } from '@/components/guarantee-badge';
import { getIncludeIcon } from '@/lib/include-icons';
import { JsonLd, offerServiceSchema, breadcrumb } from '@/lib/structured-data';
import { BeforeAfterSlider } from '@/components/before-after-slider';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { CallButton, WhatsappButton } from '@/components/cta-buttons';

/** Busca una imagen de marcador por id. */
const findImage = (id: string) =>
  placeholderImages.placeholderImages.find((p) => p.id === id);

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
    // Indexables: son páginas de oferta con precio cerrado, valiosas para
    // búsquedas comerciales y de IA. Canonical propio + hreflang para
    // diferenciarlas entre sí y de /services/.
    alternates: {
      canonical: url,
      languages: {
        es: `/es/lp/${slug}`,
        en: `/en/lp/${slug}`,
        de: `/de/lp/${slug}`,
        ca: `/ca/lp/${slug}`,
        'x-default': `/es/lp/${slug}`,
      },
    },
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

  // La garantía se muestra ahora con el sello gráfico (GuaranteeBadge), así que
  // en la fila de sellos quedan precio cerrado y sin sorpresas.
  const seals = [t.offer.seals.fixedPrice, t.offer.seals.noSurprises];
  const trustPoints = [t.trust.years, t.trust.written, t.trust.noCost, t.trust.callback];

  // Bloque antes/después: la creatividad de campaña muestra la transformación.
  // Sin fotos "reales" en el proyecto, se usan las imágenes de marcador.
  const beforeImage = findImage('hero-construction');
  const afterImage = findImage('project-1');

  // Datos estructurados de la oferta (precio) para SEO comercial y buscadores de IA.
  const canonical = `${SITE_URL}/${locale}/lp/${slug}`;
  const jsonLd = [
    offerServiceSchema({
      name: page.h1,
      description: page.subtitle,
      url: canonical,
      image: config.ogImage,
      price: config.price,
      perSqm: config.priceMode === 'perSqm',
      vatIncluded: config.vatMode === 'included',
      locale,
    }),
    breadcrumb([
      { name: 'Refcon', url: `${SITE_URL}/${locale}` },
      { name: page.h1, url: canonical },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
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

      {/* Banner de urgencia/escasez, configurable en vivo por el admin. */}
      <PromoUrgencyBanner fallbackMessage={t.agenda.urgencyFallback} />

      {/* pb-24 en móvil deja hueco para la barra fija inferior. */}
      <main className="flex-1 pb-24 md:pb-0">
        <section className="w-full bg-secondary/50 py-12 md:py-20">
          <div className="container-limited grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-forest px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  {t.offer.badge}
                </span>
                {/* Sello "llave en mano" de las creatividades. */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-forest dark:text-gold">
                  <KeyRound className="h-3.5 w-3.5" />
                  {t.offer.turnkeySeal}
                </span>
              </div>
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
              {/* CTA principal del hero: reservar la visita técnica gratis. */}
              <Button
                asChild
                size="lg"
                className="mt-8 w-full bg-gradient-to-r from-gold to-gold-light text-base font-extrabold text-forest shadow-lg hover:from-gold-light hover:to-gold sm:w-auto"
              >
                <Link href="#reservar">
                  <CalendarClock className="mr-2 h-5 w-5" />
                  {t.agenda.reserveCta}
                </Link>
              </Button>
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
                  {config.vatMode === 'included' ? t.offer.vatIncluded : t.offer.vatPlus}
                </p>

                {/* Sello gráfico de garantía, como en las creatividades. */}
                <div className="mt-6 flex justify-center">
                  <GuaranteeBadge className="h-28 w-28 drop-shadow-lg" />
                </div>

                <div className="mx-auto mt-6 grid max-w-[16rem] grid-cols-2 gap-3 border-t border-white/15 pt-7">
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
                    href="#reservar"
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-gold"
                  >
                    {t.agenda.reserveCta}
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
            <ul className="mt-10 grid gap-x-10 gap-y-5 md:grid-cols-2">
              {page.includes.map((item: string, i: number) => {
                const Icon = getIncludeIcon(config.renovationType, i);
                return (
                  <li key={item} className="flex items-start gap-3.5 text-sm">
                    {/* Icono temático en círculo verde con check dorado, como en el folleto. */}
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 ring-1 ring-forest/15">
                      <Icon className="h-5 w-5 text-forest" strokeWidth={1.9} />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-forest ring-2 ring-background">
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                    </span>
                    <span className="mt-2.5 leading-relaxed text-foreground">{item}</span>
                  </li>
                );
              })}
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

        {/* Antes/después: la prueba visual de la transformación, como el folleto. */}
        <section className="w-full bg-background py-16 md:py-24">
          <div className="container-limited max-w-5xl">
            <SectionHeading>{t.beforeAfter.title}</SectionHeading>
            {config.beforeAfter ? (
              // Comparador arrastrable con las fotos reales de la oferta.
              <div className="mt-12">
                <BeforeAfterSlider
                  before={config.beforeAfter.before}
                  after={config.beforeAfter.after}
                  beforeLabel={t.beforeAfter.before}
                  afterLabel={t.beforeAfter.after}
                  alt={page.h1}
                />
                <p className="mx-auto mt-5 max-w-md text-center text-sm text-muted-foreground">
                  {{ es: 'Arrastra para comparar', en: 'Drag to compare', de: 'Zum Vergleichen ziehen', ca: 'Arrossega per comparar' }[locale] ?? 'Arrastra para comparar'}
                </p>
              </div>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {[
                  { image: beforeImage, label: t.beforeAfter.before },
                  { image: afterImage, label: t.beforeAfter.after },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-gold/20"
                  >
                    <div className="relative aspect-[4/3]">
                      {item.image && (
                        <Image
                          src={item.image.imageUrl}
                          alt={item.label}
                          fill
                          className="object-cover"
                          data-ai-hint={item.image.imageHint}
                          sizes="(min-width: 768px) 40vw, 100vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <span className="absolute left-4 top-4 rounded-full bg-forest/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-gold shadow-md">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mismo mosaico que "Proyectos que Inspiran" de la home. Su tarjeta de
            CTA apunta a la agenda de esta página, no a /budget-request. */}
        <section className="w-full bg-secondary py-16 md:py-24">
          <div className="container-limited">
            <SectionHeading>{dict.home.projects.title}</SectionHeading>
            <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-muted-foreground">
              {dict.home.projects.subtitle}
            </p>
            <div className="mt-12">
              <FeaturedProjects t={dict.home.projects} ctaHref="#reservar" />
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
          La agenda de citas cierra la página: el visitante reserva una visita
          técnica gratuita (o una llamada) en un hueco real, en vez de pedir un
          presupuesto (las ofertas ya llevan precio cerrado).
        */}
        <section id="reservar" className="w-full scroll-mt-16 bg-secondary/40 py-16 md:py-24">
          <div className="container-limited">
            <div className="mx-auto mb-12 max-w-2xl">
              <SectionHeading>{t.agenda.title}</SectionHeading>
              <p className="mt-5 text-center leading-relaxed text-muted-foreground">
                {t.agenda.subtitle}
              </p>
            </div>
            <BookingAgenda
              t={dict}
              renovationType={config.renovationType}
              campaignSlug={slug}
              locale={locale}
            />
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
