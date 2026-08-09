import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { LegalPage } from '@/components/legal-page';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const dict = await getDictionary(locale as any);
  return { title: dict.legal.privacy.title };
}

export default async function PrivacyPage({ params: { locale } }: Props) {
  const dict = await getDictionary(locale as any);

  return (
    <LegalPage
      dict={dict}
      content={dict.legal.privacy}
      reviewNotice={dict.legal.reviewNotice}
    />
  );
}
