import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { LegalPage } from '@/components/legal-page';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const dict = await getDictionary(locale as any);
  return { title: dict.legal.terms.title };
}

export default async function TermsPage({ params: { locale } }: Props) {
  const dict = await getDictionary(locale as any);

  return (
    <LegalPage
      dict={dict}
      content={dict.legal.terms}
      reviewNotice={dict.legal.reviewNotice}
    />
  );
}
