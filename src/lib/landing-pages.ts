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
  /**
   * Imagen de vista previa al compartir el enlace. Sin ella las cinco landings
   * se ven iguales en WhatsApp, porque heredan el Open Graph del layout raíz.
   * Lo ideal es la creatividad de la oferta, que ya lleva precio y antes/después.
   */
  ogImage?: string;
};

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o';

export const landingPages: Record<LandingSlug, LandingConfig> = {
  'reforma-integral': {
    renovationType: 'integral',
    price: 437,
    priceMode: 'perSqm',
    ogImage: `${STORAGE}/refcon%2Freformas-interiores.jpg?alt=media&token=4851e102-3289-442b-bc00-dc0356241b1e`,
  },
  'reforma-bano': {
    renovationType: 'bathrooms',
    price: 5900,
    priceMode: 'fixed',
    // PENDIENTE: creatividad de la oferta de baño.
  },
  'reforma-cocina': {
    renovationType: 'kitchen',
    price: 9797,
    priceMode: 'fixed',
    ogImage: `${STORAGE}/refcon%2Fopen-plan-kitchen-area.jpg?alt=media&token=3fadbfd9-bdaa-46af-95e7-90a8860f0974`,
  },
  'cambiar-banera-por-ducha': {
    renovationType: 'showerSwap',
    price: 1990,
    priceMode: 'fixed',
    // PENDIENTE: creatividad del cambio de bañera por ducha.
  },
  'bano-sin-obras': {
    renovationType: 'bathroomNoWorks',
    price: 5900,
    priceMode: 'fixed',
    // PENDIENTE: creatividad del baño sin obras.
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
