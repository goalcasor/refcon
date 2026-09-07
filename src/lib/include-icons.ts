import {
  Bath,
  Blocks,
  Check,
  CookingPot,
  DoorClosed,
  Droplet,
  Droplets,
  Frame,
  Grid3x3,
  Hammer,
  KeyRound,
  Layers,
  Lightbulb,
  PaintRoller,
  PencilRuler,
  RectangleVertical,
  Refrigerator,
  ShowerHead,
  Sparkles,
  Trash2,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { RenovationType } from '@/components/budget-request/quick-budget-form';

/**
 * Icono temático por cada línea del "¿Qué incluye?", replicando las
 * creatividades de campaña. Se mapea por ÍNDICE (no por texto) para que
 * funcione igual en es/en/de/ca: el orden de `includes` es el mismo en los
 * cuatro idiomas. Si un índice se sale del array, cae en un check genérico.
 */
const INCLUDE_ICONS: Partial<Record<RenovationType, LucideIcon[]>> = {
  integral: [
    PencilRuler, // Diseño y planificación
    Hammer, // Demolición y retirada
    Bath, // Reforma de baño
    CookingPot, // Reforma de cocina
    DoorClosed, // Puertas interiores
    Zap, // Electricidad/fontanería/saneamiento
    Layers, // Suelos y rodapiés
    Frame, // Carpintería exterior
    PaintRoller, // Pintura
    Sparkles, // Escombros y limpieza
    KeyRound, // Llave en mano
  ],
  bathrooms: [
    Hammer, // Demolición y retirada de sanitarios
    Wrench, // Fontanería y desagües
    Grid3x3, // Revestimientos
    ShowerHead, // Plato de ducha + mampara
    Frame, // Mueble, lavabo y espejo LED
    Droplets, // Grifería
    Droplet, // Inodoro
    Lightbulb, // Iluminación LED
    Sparkles, // Acabados y limpieza
    PencilRuler, // Proyecto y asesoramiento
  ],
  kitchen: [
    Wrench, // Desmontaje cocina actual
    Hammer, // Demolición azulejos y suelos
    Zap, // Electricidad y fontanería
    Lightbulb, // Techo pladur + iluminación LED
    Grid3x3, // Pavimento y alicatado
    Blocks, // Mobiliario de cocina
    Refrigerator, // Electrodomésticos
    Droplets, // Fregadero y grifería
    Wind, // Extractor y tubos
    PaintRoller, // Pintura, escombros y limpieza
    KeyRound, // Llave en mano
  ],
  showerSwap: [
    Trash2, // Retirada de bañera
    ShowerHead, // Plato de ducha antideslizante
    RectangleVertical, // Mampara de cristal
    Droplets, // Grifería monomando
    Grid3x3, // Revestimiento de pared
    Wrench, // Fontanería y albañilería
    Sparkles, // Acabados y limpieza
  ],
  bathroomNoWorks: [
    Wrench, // Desmontaje de accesorios
    Trash2, // Retirada de bañera/plato
    Layers, // Paneles SPC
    ShowerHead, // Plato de ducha nuevo
    Droplet, // WC nuevo
    Frame, // Mueble, lavabo y espejo
    Lightbulb, // Falso techo con LED
    Zap, // Mecanismos eléctricos
    RectangleVertical, // Montaje de mampara
  ],
};

export function getIncludeIcon(type: RenovationType, index: number): LucideIcon {
  return INCLUDE_ICONS[type]?.[index] ?? Check;
}
