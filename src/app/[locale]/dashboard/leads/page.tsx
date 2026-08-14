import { getDictionary } from '@/lib/dictionaries';
import { LeadsTable } from '@/components/dashboard/leads-table';

export default async function LeadsPage({ params: { locale } }: { params: { locale: any } }) {
  const dict = await getDictionary(locale);
  const t = dict.dashboard.leads;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </div>
      <LeadsTable t={t} tBudget={dict.budgetRequest} locale={locale} />
    </div>
  );
}
