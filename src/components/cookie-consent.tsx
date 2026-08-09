'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  isAnalyticsEnabled,
  readConsent,
  updateGtagConsent,
  writeConsent,
  type ConsentValue,
} from '@/lib/analytics';

export function CookieConsent({ t, locale }: { t: any; locale: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Solo se pregunta si hay medición activa y el visitante no ha decidido antes.
    if (isAnalyticsEnabled() && readConsent() === null) {
      setVisible(true);
    }
  }, []);

  const decide = (value: ConsentValue) => {
    writeConsent(value);
    updateGtagConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    // z-[60] para quedar por encima del ContactFab, que va en z-50.
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-background p-5 shadow-lg">
        <p className="font-semibold">{t.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.message}{' '}
          <Link href={`/${locale}/privacy`} className="underline hover:text-foreground">
            {t.privacyLink}
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => decide('denied')}>
            {t.reject}
          </Button>
          <Button onClick={() => decide('granted')}>{t.accept}</Button>
        </div>
      </div>
    </div>
  );
}
