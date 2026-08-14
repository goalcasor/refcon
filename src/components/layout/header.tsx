'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Menu, Phone } from 'lucide-react';
import { PHONE, PHONE_DISPLAY } from '@/lib/site-config';
import { trackPhoneClick } from '@/lib/analytics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '../theme-switcher';

export function Header({ t }: { t: any }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { href: '/#services', label: t.header.nav.services },
    { href: '/blog', label: t.header.nav.blog },
    { href: '/contact', label: t.header.nav.contact },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-limited flex h-16 items-center">
        <div className="md:hidden">
          <Logo width={90} height={30} />
        </div>
        <div className="hidden md:block">
          <Logo width={120} height={40} />
        </div>
        <nav className="hidden md:flex items-center gap-6 ml-10 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {/*
            CTA de llamada visible también en móvil, que es donde se llama.
            Va en variante outline a propósito: el botón primario sigue siendo el
            de presupuesto, porque el lead se quiere por formulario.
          */}
          <Button asChild variant="outline" size="sm" className="px-2 md:px-3">
            <a href={`tel:${PHONE}`} onClick={trackPhoneClick} aria-label={`Llamar al ${PHONE_DISPLAY}`}>
              <Phone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{PHONE_DISPLAY}</span>
            </a>
          </Button>
          {user ? (
            <UserNav t={t.header.userNav} />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild className="cta-pulse">
                <Link href="/budget-request">{t.header.nav.budgetRequest}</Link>
              </Button>
            </div>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                    <div className="py-4">
                        <Logo />
                    </div>
                </SheetHeader>
              <div className="flex flex-col gap-4 py-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={handleLinkClick} className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
                 <Link href="/budget-request" onClick={handleLinkClick} className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {t.header.nav.budgetRequest}
                  </Link>
              </div>
              <div className="absolute bottom-4 right-4 left-4 flex flex-col gap-2">
                <Button asChild variant="outline" onClick={handleLinkClick}>
                  <a href={`tel:${PHONE}`} onClick={trackPhoneClick}>
                    <Phone className="mr-2 h-4 w-4" />
                    {PHONE_DISPLAY}
                  </a>
                </Button>
                {user ? null : (
                  <Button asChild onClick={handleLinkClick}><Link href="/budget-request">{t.header.nav.budgetRequest}</Link></Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}