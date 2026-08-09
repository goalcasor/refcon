import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

type LegalContent = {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
};

/**
 * Plantilla compartida por /privacy y /terms. Ambas páginas son requisito de
 * Google Ads: el sitio recoge datos personales en los formularios, y una
 * política de privacidad ausente o rota es motivo de desaprobación de anuncios.
 */
export function LegalPage({
  dict,
  content,
  reviewNotice,
}: {
  dict: any;
  content: LegalContent;
  reviewNotice?: string;
}) {
  return (
    <>
      <Header t={dict} />
      <main className="flex-1">
        <section className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container-limited text-center">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              {content.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">{content.updated}</p>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container-limited max-w-3xl">
            {reviewNotice && (
              <p className="mb-10 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-4 text-sm text-muted-foreground">
                {reviewNotice}
              </p>
            )}
            <div className="space-y-10">
              {content.sections.map((section) => (
                <article key={section.heading}>
                  <h2 className="font-headline text-xl font-bold">{section.heading}</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer t={dict.home.finalCta} />
    </>
  );
}
