// src/lib/site-config.ts

/**
 * Datos de contacto y perfiles externos, en un único sitio.
 *
 * Antes estaban repetidos a mano en el FAB de contacto, el formulario de
 * presupuesto, la página de contacto y las landings, lo que ya provocó que
 * conviviera un teléfono antiguo con el de las creatividades de campaña.
 */

/** URL pública canónica del sitio, sin barra final. Fuente única para
 * metadata, canonicals, sitemap, robots y JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.refconmallorca.es').replace(/\/+$/, '');

/** Correo de contacto público (aviso legal y schema). */
export const CONTACT_EMAIL = 'goalcasor@gmail.com';

/** Logo hospedado, para Open Graph y JSON-LD. */
export const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Flogo.png?alt=media&token=65447f6c-174a-45a9-8816-1e9a1688f8c9';

/** Formato E.164, para enlaces `tel:` y `wa.me`. */
export const PHONE = '+34694903163';

/** Para mostrar en pantalla. */
export const PHONE_DISPLAY = '694 90 31 63';

export const WHATSAPP_URL = `https://wa.me/${PHONE.replace('+', '')}`;

export const HABITISSIMO_URL = 'https://www.habitissimo.es/pro/refcon';
export const HABITISSIMO_REVIEWS_URL = `${HABITISSIMO_URL}/opiniones`;

/** Año de fundación, base de los "30 años" que se repiten en la web y los anuncios. */
export const FOUNDED_YEAR = 1995;
