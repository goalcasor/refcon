'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const lightLogo = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Flogo.png?alt=media&token=65447f6c-174a-45a9-8816-1e9a1688f8c9';
const darkLogo = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Flogo-BLANCO.png?alt=media&token=024ad364-d87c-4aca-8e33-6699425c28c2';

export function Logo({ className, width = 120, height = 40 }: { className?: string, width?: number, height?: number }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Default to the light (dark-text) logo for SSR and until the theme resolves,
  // so it stays visible on the light background instead of flashing the white logo.
  const logoSrc = mounted && resolvedTheme === 'dark' ? darkLogo : lightLogo;

  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold font-headline", className)}>
      <Image
        src={logoSrc}
        alt="Refcon Logo"
        width={width}
        height={height}
        priority
      />
    </Link>
  );
}
