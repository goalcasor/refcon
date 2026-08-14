import type { RenovationType } from '@/components/budget-request/quick-budget-form';

/**
 * Landings de oferta de la campaña de Google Ads.
 *
 * Una por grupo de anuncios, con el titular replicando la keyword del grupo y el
 * mismo precio que anuncian las creatividades. Van con `noindex` para no
 * canibalizar el SEO de /services/.
 */
export type LandingSlug =
  | 'reforma-integral'
  | 'reforma-bano'
  | 'reforma-cocina'
  | 'cambiar-banera-por-ducha'
  | 'bano-sin-obras';

type LandingConfig = {
  /** Preselecciona el tipo en el formulario, para que el visitante no tenga que elegirlo. */
  renovationType: RenovationType;
  /** Importe del "desde" de la creatividad, en euros. */
  price: number;
  /** `perSqm` muestra "€/m²"; `fixed` muestra el importe cerrado. */
  priceMode: 'perSqm' | 'fixed';
};

export const landingPages: Record<LandingSlug, LandingConfig> = {
  'reforma-integral': {
    renovationType: 'integral',
    price: 437,
    priceMode: 'perSqm',
  },
  'reforma-bano': {
    renovationType: 'bathrooms',
    price: 5900,
    priceMode: 'fixed',
  },
  'reforma-cocina': {
    renovationType: 'kitchen',
    price: 9797,
    priceMode: 'fixed',
  },
  'cambiar-banera-por-ducha': {
    renovationType: 'showerSwap',
    price: 1990,
    priceMode: 'fixed',
  },
  'bano-sin-obras': {
    renovationType: 'bathroomNoWorks',
    price: 5900,
    priceMode: 'fixed',
  },
};

export const landingSlugs = Object.keys(landingPages) as LandingSlug[];

/**
 * Formatea el importe sin el símbolo de moneda, para poder pintar el € aparte
 * en dorado como en las creatividades.
 *
 * `useGrouping: 'always'` es necesario: es-ES no agrupa los números de cuatro
 * cifras por defecto y 5900 se imprimía como "5900" en vez de "5.900".
 */
export function formatOfferAmount(config: LandingConfig, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'es-ES', {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  }).format(config.price);
}

/** Sufijo que acompaña al símbolo: "/m²" en las tarifas por superficie. */
export const offerPriceSuffix = (config: LandingConfig) =>
  config.priceMode === 'perSqm' ? '/m²' : '';
