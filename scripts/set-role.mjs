/**
 * Asigna un rol (custom claim) a un usuario de Firebase Auth.
 *
 * Los custom claims SOLO se pueden fijar con el Admin SDK, así que necesitas la
 * clave de servicio del proyecto (no se guarda en el repo).
 *
 * Pasos:
 *   1) Firebase Console → Configuración del proyecto → Cuentas de servicio →
 *      "Generar nueva clave privada" → descarga el JSON (NO lo subas al repo).
 *   2) Instala el Admin SDK:   npm i -D firebase-admin
 *   3) Apunta a la clave (PowerShell):
 *        $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\serviceAccount.json"
 *   4) Ejecuta:
 *        node scripts/set-role.mjs goalcasor@gmail.com admin
 *      (rol por defecto: "admin"; usa "superadmin" si lo prefieres)
 *
 * El usuario debe CERRAR SESIÓN y volver a entrar para que el token recoja el rol.
 */
import fs from 'node:fs';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2] || 'goalcasor@gmail.com';
const role = process.argv[3] || 'admin';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp({
  credential:
    keyPath && fs.existsSync(keyPath)
      ? cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')))
      : applicationDefault(),
});

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims || {}), role };
await auth.setCustomUserClaims(user.uid, claims);
await auth.revokeRefreshTokens(user.uid); // fuerza refresco del token
console.log(`OK · ${email} (uid ${user.uid}) → role="${role}"`);
console.log('El usuario debe cerrar sesión y volver a entrar para recoger el rol.');
process.exit(0);
