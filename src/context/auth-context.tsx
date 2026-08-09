'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getSafeAuth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSafeAuth will only run on the client, preventing build errors
    const auth = getSafeAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
