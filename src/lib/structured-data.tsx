import {
  SITE_URL,
  PHONE,
  CONTACT_EMAIL,
  LOGO_URL,
  FOUNDED_YEAR,
  HABITISSIMO_URL,
} from '@/lib/site-config';
import { HABITISSIMO_RATING, HABITISSIMO_REVIEW_COUNT } from '@/lib/reviews';

/**
 * Datos estructurados (Schema.org / JSON-LD) para SEO y buscadores de IA (GEO).
 *
 * Un único sitio para construir los objetos, que luego se pintan con <JsonLd>.
 * Solo se añade en páginas públicas indexables; las landings `/lp` van noindex
 * y no llevan schema.
 */

/** BCP-47 por locale, para `inLanguage`. */
export function bcp47(locale: string): string {
  return locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-DE' : locale === 'ca' ? 'ca-ES' : 'es-ES';
}

const ORG_ID = `${SITE_URL}/#organization`;

/** Negocio/Organización: identidad de marca reutilizable como `provider`/`publisher`. */
export function localBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': ORG_ID,
    name: 'Refcon',
    legalName: 'Refcon',
    slogan: 'Constructores de sueños',
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    telephone: PHONE,
    email: CONTACT_EMAIL,
    foundingDate: String(FOUNDED_YEAR),
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Illes Balears',
      addressCountry: 'ES',
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Mallorca' },
      { '@type': 'AdministrativeArea', name: 'Illes Balears' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: HABITISSIMO_RATING,
      reviewCount: HABITISSIMO_REVIEW_COUNT,
      bestRating: 5,
    },
    sameAs: [HABITISSIMO_URL],
  };
}

/** WebSite del sitio (una vez, en el layout). */
export function webSite(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Refcon',
    inLanguage: bcp47(locale),
    publisher: { '@id': ORG_ID },
  };
}

/** Servicio concreto (páginas /services/[slug]). */
export function serviceSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.image && { image: params.image }),
    inLanguage: bcp47(params.locale),
    serviceType: params.name,
    areaServed: { '@type': 'AdministrativeArea', name: 'Mallorca' },
    provider: { '@id': ORG_ID },
  };
}

/**
 * Oferta con precio (landings /lp): Service con un Offer. Para el precio por m²
 * (integral) se usa UnitPriceSpecification; para las ofertas cerradas, un Offer
 * con `price`. Rico para SEO comercial y buscadores de IA.
 */
export function offerServiceSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price: number;
  perSqm: boolean;
  vatIncluded: boolean;
  locale: string;
}) {
  const offer = params.perSqm
    ? {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: params.price,
          priceCurrency: 'EUR',
          unitText: 'm²',
          valueAddedTaxIncluded: params.vatIncluded,
        },
      }
    : {
        '@type': 'Offer',
        price: params.price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        valueAddedTaxIncluded: params.vatIncluded,
      };
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.image && { image: params.image }),
    inLanguage: bcp47(params.locale),
    serviceType: params.name,
    areaServed: { '@type': 'AdministrativeArea', name: 'Mallorca' },
    provider: { '@id': ORG_ID },
    offers: offer,
  };
}

/** Artículo de blog (páginas /blog/[slug]). */
export function blogPostingSchema(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description,
    url: params.url,
    mainEntityOfPage: params.url,
    inLanguage: bcp47(params.locale),
    ...(params.image && { image: params.image }),
    ...(params.datePublished && { datePublished: params.datePublished }),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
}

/** Miga de pan para páginas de detalle. */
export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Pinta uno o varios objetos JSON-LD como <script>. */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
