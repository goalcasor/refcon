'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Logo({ className, width = 120, height = 40 }: { className?: string, width?: number, height?: number }) {
  const { theme } = useTheme();
  const [logoSrc, setLogoSrc] = useState('/logo-light.png'); // Default logo

  const lightLogo = 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frefcon%2Flogo.png?alt=media&token=38143ad5-4e83-49bb-861f-825f22cbe1d5';
  const darkLogo = 'https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Frefcon%2Flogo-BLANCO.png?alt=media&token=ff52271f-8fcc-4094-8b8d-2adc73b1a34f';

  useEffect(() => {
    // The theme might be undefined on the first render, so we check.
    // The theme string includes whether it's dark or not, e.g., "dark-theme-green".
    if (theme) {
      setLogoSrc(theme.startsWith('dark-') ? darkLogo : lightLogo);
    }
  }, [theme]);

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