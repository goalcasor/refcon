// src/lib/analytics.ts

/**
 * Google Analytics 4 + Google Ads.
 *
 * Todos los eventos pasan por aquí para que respeten el estado de consentimiento
 * (Consent Mode v2), obligatorio en la UE. Sin consentimiento concedido, gtag
 * recibe los eventos pero no escribe cookies ni envía identificadores.
 */

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? '';
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '';

/**
 * Etiquetas de las acciones de conversión de Google Ads: la parte tras la barra
 * en `AW-XXXXX/YYYYY`. Cada CTA tiene la suya para poder verlas por separado en
 * los informes y decidir cuál merece la pena.
 */
export const ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_ADS_LEAD_LABEL ?? '';
export const ADS_WHATSAPP_LABEL = process.env.NEXT_PUBLIC_ADS_WHATSAPP_LABEL ?? '';
export const ADS_CALL_LABEL = process.env.NEXT_PUBLIC_ADS_CALL_LABEL ?? '';

export const CONSENT_COOKIE = 'refcon_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

export type ConsentValue = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** No montamos nada si no hay IDs configurados (p. ej. en desarrollo local). */
export const isAnalyticsEnabled = () => Boolean(GA4_ID || GOOGLE_ADS_ID);

/**
 * Script que debe ejecutarse ANTES de cargar gtag.js. Define el estado por defecto
 * como denegado y lo actualiza de inmediato si el visitante ya aceptó en otra visita,
 * para que un usuario recurrente no pierda medición mientras se pinta el banner.
 */
export const CONSENT_BOOTSTRAP_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  analytics_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  wait_for_update:500
});
try {
  var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
  if (m && m[1] === 'granted') {
    gtag('consent','update',{
      ad_storage:'granted',
      analytics_storage:'granted',
      ad_user_data:'granted',
      ad_personalization:'granted'
    });
  }
} catch (e) {}
gtag('js', new Date());
`;

export function readConsent(): ConsentValue | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === 'granted' || value === 'denied' ? value : null;
}

export function writeConsent(value: ConsentValue) {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSENT_COOKIE}=${value};path=/;max-age=${CONSENT_MAX_AGE};SameSite=Lax`;
}

/** Propaga la decisión del usuario a Google. */
export function updateGtagConsent(value: ConsentValue) {
  window.gtag?.('consent', 'update', {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  window.gtag?.('event', name, params);
}

/**
 * Lead de presupuesto: evento de GA4 más conversión de Google Ads.
 *
 * Se envía el importe estimado por el formulario como `value`. Mandar el valor real
 * es lo que permitirá optimizar por importe de proyecto —y no solo por número de
 * leads— cuando haya datos suficientes para migrar a puja por conversiones.
 */
export function trackLead(params: {
  value?: number | null;
  renovationType: string;
  callPreference: string;
}) {
  const { value, renovationType, callPreference } = params;
  const amount = value && value > 0 ? { value, currency: 'EUR' } : {};

  trackEvent('generate_lead', {
    ...amount,
    renovation_type: renovationType,
    call_preference: callPreference,
  });

  sendAdsConversion(ADS_LEAD_LABEL, amount);
}

/** Envía la conversión a Google Ads si la etiqueta está configurada. */
function sendAdsConversion(label: string, params: Record<string, unknown> = {}) {
  if (!GOOGLE_ADS_ID || !label) return;
  trackEvent('conversion', { send_to: `${GOOGLE_ADS_ID}/${label}`, ...params });
}

/** Clic en WhatsApp: captura el contacto, así que cuenta como conversión. */
export function trackWhatsappClick() {
  trackEvent('click_whatsapp');
  sendAdsConversion(ADS_WHATSAPP_LABEL);
}

/**
 * Clic en un enlace `tel:`.
 *
 * Se cuenta como conversión desde que la llamada pasó a ser el CTA principal de
 * las landings: dejarla fuera hacía que Ads viera una fracción de los leads
 * reales. Si se activa el número de desvío en la extensión de llamada, esta
 * acción debe pasar a **secundaria**, porque entonces mediría lo mismo dos veces
 * y con peor calidad (un clic no es una conversación).
 */
export function trackPhoneClick() {
  trackEvent('click_phone');
  sendAdsConversion(ADS_CALL_LABEL);
}

/**
 * Salida hacia el perfil de Habitissimo.
 *
 * Se mide porque es una fuga con coste real: el visitante llegó por un clic de
 * pago y Habitissimo es un marketplace donde también aparecen competidores. Con
 * el dato se puede decidir si el enlace compensa o conviene retirarlo.
 */
export const trackHabitissimoClick = () => trackEvent('click_habitissimo');
