import { getDictionary } from '@/lib/dictionaries';
import { AgendaTable } from '@/components/dashboard/agenda-table';

export default async function AgendaPage({ params: { locale } }: { params: { locale: any } }) {
  const dict = await getDictionary(locale);
  const t = dict.dashboard.agenda;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </div>
      <AgendaTable t={t} locale={locale} />
    </div>
  );
}
