import type { Metadata } from 'next';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import i18nConfig from '../../../i18nConfig';
import { notFound } from 'next/navigation';
import { ContactFab } from '@/components/contact-fab';
import { ThemeProvider } from "next-themes";
import { Analytics } from '@/components/analytics';
import { CookieConsent } from '@/components/cookie-consent';
import { CONSENT_BOOTSTRAP_SCRIPT } from '@/lib/analytics';
import { getDictionary } from '@/lib/dictionaries';
import { SITE_URL, LOGO_URL } from '@/lib/site-config';
import { JsonLd, localBusiness, webSite } from '@/lib/structured-data';

const siteConfig = {
  name: 'Refcon',
  description: 'Con 30 años de experiencia desde 1995, en Refcon somos constructores de sueños. Ofrecemos soluciones expertas en reformas, construcción y piscinas.',
  url: SITE_URL,
  ogImage: LOGO_URL,
};

/** Contenedor de Google Tag Manager. Override por entorno en Vercel si hace falta. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-W39LNXZR';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,

  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 256,
        height: 256,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string }
}) {
  if (!i18nConfig.locales.includes(locale)) {
    notFound();
  }

  const t = await getDictionary(locale as 'es' | 'en' | 'de' | 'ca');

  const faviconUrl = "https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2FICON.png?alt=media&token=8735449a-b5fc-4651-8f1c-12d397691de7";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Playfair+Display:ital,wght@0,500..800;1,500..800&display=swap" rel="stylesheet" />
        {/*
          Consent Mode v2. Va como <script> inline y no como next/script para
          garantizar que se ejecuta antes que gtag.js: el estado por defecto tiene
          que estar en "denied" antes de que cargue ninguna etiqueta de Google.
        */}
        {/* Consent Mode v2 por defecto (denegado) ANTES de cargar cualquier
            etiqueta de Google, incluido GTM. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP_SCRIPT }} />
        {/* Google Tag Manager */}
        {GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
        {/* Datos estructurados de marca (SEO + buscadores de IA). */}
        <JsonLd data={[localBusiness(), webSite(locale)]} />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background flex flex-col')}>
        {/* Google Tag Manager (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="refcon-theme"
        >
          <AuthProvider>
            {children}
            <Toaster />
            <ContactFab />
            <CookieConsent t={t.consent} locale={locale} />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
