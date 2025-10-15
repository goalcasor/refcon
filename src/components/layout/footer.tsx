import { Logo } from '@/components/logo';
import Link from 'next/link';

export function Footer({ t }: { t?: any }) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-secondary/50">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col items-center text-center gap-6">
          <Logo width={120} height={40} />
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Constructores de sueños.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Política de Privacidad</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Términos de Servicio</Link>
          </div>
          {t && (
             <div className='mt-4'>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                  {t.reviewLink}
                </a>
              </div>
          )}
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Refcon. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}