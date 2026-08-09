'use client';

import Script from 'next/script';
import { GA4_ID, GOOGLE_ADS_ID } from '@/lib/analytics';

/**
 * Carga gtag.js y configura GA4 y Google Ads.
 *
 * El estado de consentimiento ya está inicializado como denegado por
 * CONSENT_BOOTSTRAP_SCRIPT, que el layout inyecta en el <head> antes que esto.
 */
export function Analytics() {
  const primaryId = GA4_ID || GOOGLE_ADS_ID;
  if (!primaryId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-config" strategy="afterInteractive">
        {[
          GA4_ID && `gtag('config','${GA4_ID}');`,
          GOOGLE_ADS_ID && `gtag('config','${GOOGLE_ADS_ID}');`,
        ]
          .filter(Boolean)
          .join('\n')}
      </Script>
    </>
  );
}
