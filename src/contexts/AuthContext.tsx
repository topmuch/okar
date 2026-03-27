'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Role, hasPermission, hasAnyPermission, Permission, PERMISSIONS } from '@/lib/permissions';

// ============================================
// User type
// ============================================
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  agencyId?: string | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  garageId?: string | null;
  garage?: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    isCertified?: boolean;
  } | null;
}

// ============================================
// Auth context type
// ============================================
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isAgency: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  refreshSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,  // TRUE par défaut - on ne sait pas encore
  login: () => {},
  logout: async () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  isAdmin: false,
  isAgent: false,
  isAgency: false,
  can: () => false,
  canAny: () => false,
  refreshSession: async () => {},
});

// ============================================
// Provider component
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // TRUE au départ - CRUCIAL
  const router = useRouter();
  const pathname = usePathname();

  // ============================================
  // INITIALISATION - Une seule fois au montage
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      // 1. On commence par dire qu'on charge
      setLoading(true);
      
      try {
        console.log('[AUTH] 🔍 Début vérification session...');
        
        // 2. Appel API pour valider la session (avec timeout de sécurité)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log('[AUTH] ⏱️ Timeout - abort');
        }, 10000); // 10 secondes max
        
        const response = await fetch('/api/auth/session', {
          credentials: 'include', // CRUCIAL pour envoyer le cookie
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // 3. Traitement de la réponse
        if (data.authenticated && data.user) {
          console.log('[AUTH] ✅ Utilisateur connecté:', data.user.email, data.user.role);
          setUser(data.user as User);
        } else {
          console.log('[AUTH] ❌ Pas de session valide');
          setUser(null);
        }
      } catch (error) {
        // Gestion des erreurs (timeout, network, etc.)
        console.error('[AUTH] ❌ Erreur lors de la vérification:', error);
        setUser(null);
      } finally {
        // 4. CRUCIAL: On passe loading à false SEULEMENT quand tout est fini
        console.log('[AUTH] ✅ Chargement terminé');
        setLoading(false);
      }
    };

    initAuth();
  }, []); // [] = une seule fois au montage

  // ============================================
  // Login function - appelée après login API réussi
  // ============================================
  const login = useCallback((userData: User) => {
    console.log('[AUTH] 🎉 Login:', userData.email);
    setUser(userData);
    setLoading(false);
  }, []);

  // ============================================
  // Logout function
  // ============================================
  const logout = useCallback(async () => {
    console.log('[AUTH] 🚪 Logout');
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AUTH] Erreur logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // ============================================
  // Refresh session
  // ============================================
  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH] Erreur refresh:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Computed values
  // ============================================
  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  const isAgency = user?.role === 'agency';

  // ============================================
  // Permission helpers
  // ============================================
  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAny = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isAgent,
        isAgency,
        can,
        canAny,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook to use auth
// ============================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// Hook for protected routes - LE JUGE PATIENT
// ============================================
export function useRequireAuth(allowedRoles?: Role[]) {
  const { user, loading, logout, refreshSession, can, canAny } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. SI ÇA CHARGE ENCORE : On ne fait RIEN
    // C'est cette ligne qui empêche la boucle !
    if (loading) {
      console.log('[useRequireAuth] ⏳ En attente du chargement...');
      return;
    }

    // 2. SI ÇA A FINI DE CHARGER ET QU'IL N'Y A PAS D'USER
    if (!loading && !user) {
      console.log('[useRequireAuth] ❌ Pas d\'utilisateur, redirection login');
      const isAdminArea = pathname?.startsWith('/admin');
      const loginPath = isAdminArea ? '/admin/connexion' : '/garage/connexion';
      router.replace(loginPath);
      return;
    }

    // 3. Vérification des rôles
    if (user && allowedRoles && allowedRoles.length > 0) {
      const hasRole = allowedRoles.includes(user.role);
      if (!hasRole) {
        console.log('[useRequireAuth] ⚠️ Mauvais rôle, redirection');
        if (['superadmin', 'admin', 'agent'].includes(user.role)) {
          router.replace('/admin/tableau-de-bord');
        } else if (user.role === 'garage') {
          router.replace('/garage/tableau-de-bord');
        } else if (user.role === 'driver') {
          router.replace('/driver/tableau-de-bord');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, loading, allowedRoles, router, pathname]);

  return { user, loading, logout, refreshSession, can, canAny };
}

export default AuthContext;
