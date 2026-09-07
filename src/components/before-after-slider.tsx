'use client';

import { useCallback, useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

/**
 * Comparador antes/después: dos imágenes superpuestas y un tirador que se
 * arrastra de lado a lado para revelar el "antes". La imagen "después" es la
 * base; la "antes" se recorta por la izquierda con clip-path (no se deforma).
 *
 * Funciona con ratón, táctil (pointer events) y teclado (input range oculto).
 * Las dos imágenes deben tener la misma proporción; el contenedor recorta a
 * 3:4 con object-cover, así que ambas quedan alineadas.
 */
export function BeforeAfterSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  alt,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  alt: string;
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  return (
    <figure
      ref={containerRef}
      className="relative mx-auto aspect-[3/4] w-full max-w-md cursor-ew-resize select-none overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* Después (base) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-forest/90 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white shadow">
        {afterLabel}
      </span>

      {/* Antes (recortado a la izquierda) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span
        className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white shadow transition-opacity"
        style={{ opacity: pos > 14 ? 1 : 0 }}
      >
        {beforeLabel}
      </span>

      {/* Línea divisoria + tirador */}
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="mx-auto h-full w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" />
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-forest shadow-lg ring-2 ring-forest/20">
          <MoveHorizontal className="h-5 w-5" />
        </div>
      </div>

      {/* Accesibilidad / teclado (flechas mueven el tirador) */}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`${beforeLabel} / ${afterLabel}`}
        className="absolute inset-x-0 bottom-0 h-9 w-full cursor-ew-resize opacity-0"
      />
    </figure>
  );
}
