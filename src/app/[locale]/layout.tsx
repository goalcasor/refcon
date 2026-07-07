import type { Metadata } from 'next';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import i18nConfig from '../../../i18nConfig';
import { notFound } from 'next/navigation';
import { ContactFab } from '@/components/contact-fab';
import { ThemeProvider } from "next-themes";

const siteConfig = {
  name: 'Refcon',
  description: 'Con 30 años de experiencia desde 1995, en Refcon somos constructores de sueños. Ofrecemos soluciones expertas en reformas, construcción y piscinas.',
  url: 'https://example.com', // Replace with your actual domain
  ogImage: '', // Replace with your actual OG image URL
};

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string }
}) {
  if (!i18nConfig.locales.includes(locale)) {
    notFound();
  }
  
  const faviconUrl = "https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2FICON.png?alt=media&token=8735449a-b5fc-4651-8f1c-12d397691de7";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} sizes="any" />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background flex flex-col')}>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
