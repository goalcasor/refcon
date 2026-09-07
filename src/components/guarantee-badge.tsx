/**
 * Sello "5 AÑOS DE GARANTÍA" de las creatividades de campaña, como SVG.
 *
 * Se dibuja en vez de usar la imagen del folleto para que sea nítido a
 * cualquier tamaño, no dependa de una descarga externa y use la paleta de
 * marca (verde bosque + dorado). Colores fijos: no cambian con el tema.
 */
export function GuaranteeBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 205"
      className={className}
      role="img"
      aria-label="5 años de garantía"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gb-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EBCE76" />
          <stop offset="0.5" stopColor="#C9A227" />
          <stop offset="1" stopColor="#9C7A18" />
        </linearGradient>
      </defs>

      {/* Aro dorado y disco verde */}
      <circle cx="110" cy="93" r="86" fill="url(#gb-gold)" />
      <circle cx="110" cy="93" r="79" fill="#14532d" />
      <circle cx="110" cy="93" r="71" fill="none" stroke="url(#gb-gold)" strokeWidth="2.5" />

      {/* Cinco estrellas en arco */}
      <text
        x="110"
        y="58"
        textAnchor="middle"
        fontSize="20"
        letterSpacing="3"
        fill="url(#gb-gold)"
      >
        ★★★★★
      </text>

      {/* Número y "AÑOS" */}
      <text
        x="110"
        y="122"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="82"
        fill="#ffffff"
      >
        5
      </text>
      <text
        x="110"
        y="150"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="3"
        fill="#ffffff"
      >
        AÑOS
      </text>

      {/* Cinta "DE GARANTÍA" */}
      <path d="M14 165 L38 157 L38 189 L14 197 Z" fill="#8A6C15" />
      <path d="M206 165 L182 157 L182 189 L206 197 Z" fill="#8A6C15" />
      <rect x="28" y="154" width="164" height="30" rx="3" fill="url(#gb-gold)" />
      <text
        x="110"
        y="174"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="1.5"
        fill="#14532d"
      >
        DE GARANTÍA
      </text>
    </svg>
  );
}
