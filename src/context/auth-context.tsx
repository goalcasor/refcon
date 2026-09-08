'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getSafeAuth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  /** Rol del custom claim del ID token: 'admin' | 'superadmin' | null. */
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSafeAuth will only run on the client, preventing build errors
    const auth = getSafeAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      // El rol viaja como custom claim en el ID token (lo fija el Admin SDK).
      if (user) {
        try {
          const token = await user.getIdTokenResult();
          setRole((token.claims.role as string) ?? null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const auth = getSafeAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Se renderiza siempre `children`, incluso mientras Firebase resuelve la sesión.
  //
  // Antes este provider devolvía un esqueleto a pantalla completa mientras `loading`
  // era true. Como envuelve todo el árbol en el layout raíz, eso impedía que ninguna
  // página se renderizara en servidor: el HTML llegaba sin contenido y el texto solo
  // aparecía tras arrancar Firebase en el cliente. Penalizaba el LCP y la experiencia
  // de página de destino que puntúa Google Ads.
  //
  // Las rutas que sí necesitan sesión se protegen por su cuenta: `dashboard-layout.tsx`
  // consume `loading` del contexto y redirige a /login.
  return (
    <AuthContext.Provider
      value={{ user, role, isAdmin: role === 'admin' || role === 'superadmin', loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
