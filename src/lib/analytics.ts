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

/** Etiqueta de la conversión de lead en Google Ads: la parte tras la barra en `AW-XXXXX/YYYYY`. */
export const ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_ADS_LEAD_LABEL ?? '';

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

  if (GOOGLE_ADS_ID && ADS_LEAD_LABEL) {
    trackEvent('conversion', {
      send_to: `${GOOGLE_ADS_ID}/${ADS_LEAD_LABEL}`,
      ...amount,
    });
  }
}

/**
 * Clic en WhatsApp: cuenta como conversión secundaria porque también captura el contacto.
 */
export const trackWhatsappClick = () => trackEvent('click_whatsapp');

/**
 * Clic en teléfono: se registra en GA4 solo para observación.
 *
 * NO se importa como conversión en Google Ads. El propietario prefiere captar el
 * contacto por formulario y llamar después, así que este clic no representa el lead
 * que se quiere optimizar y no debe influir en la puja.
 */
export const trackPhoneClick = () => trackEvent('click_phone');
