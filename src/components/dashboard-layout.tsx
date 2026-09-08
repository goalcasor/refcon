'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Lightbulb,
  Settings,
  PlusCircle,
  DollarSign,
  CalendarDays,
  CalendarCog,
  Menu,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/auth/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { LanguageSwitcher } from './language-switcher';

export function DashboardLayout({ children, t }: { children: React.ReactNode, t: any }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: <LayoutDashboard /> },
    { href: '/dashboard/leads', label: t.dashboard.nav.leads, icon: <Inbox /> },
    { href: '/dashboard/agenda', label: t.dashboard.nav.agenda, icon: <CalendarDays /> },
    { href: '/dashboard/budget-request', label: t.dashboard.nav.requestBudget, icon: <PlusCircle /> },
    { href: '/dashboard/seo-generator', label: t.dashboard.nav.seoGenerator, icon: <Lightbulb /> },
  ];

  const settingsNavItems = [
    { href: '/dashboard/settings/pricing', label: t.dashboard.nav.pricing, icon: <DollarSign /> },
    { href: '/dashboard/settings/agenda', label: t.dashboard.nav.agendaSettings, icon: <CalendarCog /> },
    { href: '/dashboard/settings', label: t.dashboard.nav.settings, icon: <Settings /> },
  ]

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else if (!isAdmin) {
      // Autenticado pero sin rol admin: no puede acceder al panel.
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    // Spinner mientras carga o mientras redirige a un usuario sin permisos.
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.endsWith(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
           <SidebarMenu className="mt-auto">
            {settingsNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.includes(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center">
            <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container flex h-16 items-center gap-2">
             {/* Hamburguesa: abre el cajón lateral en móvil (arreglo rápido). */}
             <SidebarTrigger className="md:hidden" />
             <div className="ml-auto">
               <UserNav t={t.header.userNav} />
             </div>
          </div>
        </header>
        {/* pb-24 en móvil deja hueco para la barra inferior. */}
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
            {children}
        </main>
        <DashboardBottomNav t={t} />
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Barra de navegación inferior estilo app nativa (solo móvil). */
function DashboardBottomNav({ t }: { t: any }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const locale = pathname.split('/')[1] || 'es';
  const items = [
    { href: '/dashboard', label: t.dashboard.nav.dashboard, icon: LayoutDashboard },
    { href: '/dashboard/agenda', label: t.dashboard.nav.agenda, icon: CalendarDays },
    { href: '/dashboard/leads', label: t.dashboard.nav.leads, icon: Inbox },
  ];
  const moreLabel =
    ({ es: 'Más', en: 'More', de: 'Mehr', ca: 'Més' } as Record<string, string>)[locale] ?? 'Más';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === `/${locale}${href}` || pathname.endsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        {/* "Más": abre el cajón lateral con el resto de apartados. */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          {moreLabel}
        </button>
      </div>
    </nav>
  );
}
