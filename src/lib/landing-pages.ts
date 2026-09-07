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
   * Cómo tratar el IVA en el panel de precio, según lo que diga la creatividad de
   * cada oferta: `plus` para "+ IVA" y `included` para "IVA incluido" (el flyer
   * del cambio de bañera por ducha anuncia el importe con el IVA ya dentro).
   */
  vatMode: 'plus' | 'included';
  /**
   * Imagen de vista previa al compartir el enlace. Sin ella las cinco landings
   * se ven iguales en WhatsApp, porque heredan el Open Graph del layout raíz.
   * Lo ideal es la creatividad de la oferta, que ya lleva precio y antes/después.
   */
  ogImage?: string;
  /** Par de imágenes para el comparador antes/después. Si falta, la sección usa placeholders. */
  beforeAfter?: { before: string; after: string };
};

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o';

/** Construye la URL de descarga de una imagen antes/después subida a Storage. */
const ba = (file: string, token: string) =>
  `${STORAGE}/refcon%2Fbefore-after%2F${file}?alt=media&token=${token}`;

// El cambio de bañera comparte el par de baño (misma transformación).
const banoBA = {
  before: ba('bano-antes.jpg', 'e4b9010a-5bce-4b44-af8d-ab4f7e15cc7a'),
  after: ba('bano-despues.jpg', '220c99b5-67cc-4a07-91a5-5c59576ba695'),
};
const cocinaBA = {
  before: ba('cocina-antes.jpg', 'e11aa437-3b59-4ec5-85af-3509f424de07'),
  after: ba('cocina-despues.jpg', 'd0ebd81d-dc43-434e-9189-4bb2a219705a'),
};

export const landingPages: Record<LandingSlug, LandingConfig> = {
  'reforma-integral': {
    renovationType: 'integral',
    price: 437,
    priceMode: 'perSqm',
    vatMode: 'plus',
    ogImage: `${STORAGE}/refcon%2Freformas-interiores.jpg?alt=media&token=4851e102-3289-442b-bc00-dc0356241b1e`,
  },
  'reforma-bano': {
    renovationType: 'bathrooms',
    // 5.990 € es el importe que anuncia el flyer de la campaña de baño.
    price: 5990,
    priceMode: 'fixed',
    vatMode: 'plus',
    beforeAfter: banoBA,
  },
  'reforma-cocina': {
    renovationType: 'kitchen',
    price: 9797,
    priceMode: 'fixed',
    vatMode: 'plus',
    ogImage: `${STORAGE}/refcon%2Fopen-plan-kitchen-area.jpg?alt=media&token=3fadbfd9-bdaa-46af-95e7-90a8860f0974`,
    beforeAfter: cocinaBA,
  },
  'cambiar-banera-por-ducha': {
    renovationType: 'showerSwap',
    price: 1990,
    priceMode: 'fixed',
    // El flyer de esta oferta anuncia "IVA INCLUIDO".
    vatMode: 'included',
    beforeAfter: banoBA,
  },
  'bano-sin-obras': {
    renovationType: 'bathroomNoWorks',
    price: 5900,
    priceMode: 'fixed',
    vatMode: 'plus',
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
