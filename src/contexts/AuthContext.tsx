'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Role, hasPermission, hasAnyPermission, Permission, PERMISSIONS } from '@/lib/permissions';

// ============================================
// 🐛 DEBUG FLAGS - Set to true in production for debugging
// ============================================
const DEBUG_AUTH = process.env.NODE_ENV === 'development';

function debugLog(...args: unknown[]) {
  if (DEBUG_AUTH) {
    console.log('[AUTH]', new Date().toISOString().split('T')[1], ...args);
  }
}

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
  initialized: boolean;  // NEW: Track if initial fetch is complete
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

// Create context with safe defaults
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
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
// Login pages that should NOT redirect
// ============================================
const LOGIN_PAGES = new Set([
  '/login',
  '/admin/connexion',
  '/admin/login',
  '/garage/connexion',
  '/garage/inscrire',
  '/garage/activate',
  '/agence/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

function isLoginPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return LOGIN_PAGES.has(pathname) || pathname.startsWith('/activate/');
}

// ============================================
// Provider component
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Track if we've already fetched session to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // ============================================
  // Fetch session from server (cookie-based)
  // ============================================
  const fetchSession = useCallback(async (isInitialFetch = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      debugLog('Fetch already in progress, skipping');
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      debugLog('Fetching session from /api/auth/session');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch('/api/auth/session', {
        signal: controller.signal,
        credentials: 'include', // Important: include cookies
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      debugLog('Session response:', { authenticated: data.authenticated, userId: data.user?.id });

      if (data.authenticated && data.user) {
        setUser(data.user as User);
        debugLog('User set:', data.user.email, data.user.role);
      } else {
        setUser(null);
        debugLog('No user in session');
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        debugLog('Session fetch timed out');
      } else {
        debugLog('Error fetching session:', err.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      
      if (isInitialFetch) {
        setInitialized(true);
        debugLog('Auth initialized');
      }
    }
  }, []);

  // ============================================
  // Initialize auth state - RUN ONCE
  // ============================================
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    debugLog('Initializing auth, pathname:', pathname);
    fetchSession(true);
  }, []); // Empty deps - only run once

  // ============================================
  // Login function - called after successful login API call
  // ============================================
  const login = useCallback((userData: User) => {
    debugLog('Login called for:', userData.email);
    setUser(userData);
    setInitialized(true);
  }, []);

  // ============================================
  // Logout function - calls logout API and clears state
  // ============================================
  const logout = useCallback(async () => {
    debugLog('Logout called');
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      debugLog('Error during logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // ============================================
  // Refresh session from server
  // ============================================
  const refreshSession = useCallback(async () => {
    debugLog('Refresh session called');
    await fetchSession(false);
  }, [fetchSession]);

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
        initialized,
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
// Hook for protected routes - WITH SAFE REDIRECTS
// ============================================
export function useRequireAuth(allowedRoles?: Role[]) {
  const { user, loading, initialized, logout, refreshSession, can, canAny } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Wait for initialization to complete
    if (!initialized || loading) {
      debugLog('useRequireAuth: waiting for initialization');
      return;
    }

    // Don't redirect on login pages
    if (isLoginPage(pathname)) {
      debugLog('useRequireAuth: on login page, skipping redirect');
      return;
    }

    // Prevent multiple redirect attempts
    if (redirectAttempted.current) {
      debugLog('useRequireAuth: redirect already attempted');
      return;
    }

    // Not authenticated
    if (!user) {
      debugLog('useRequireAuth: no user, redirecting to login');
      redirectAttempted.current = true;
      
      const isAdminArea = pathname?.startsWith('/admin');
      const isGarageArea = pathname?.startsWith('/garage');
      const isDriverArea = pathname?.startsWith('/driver');
      
      let loginPath = '/login';
      if (isAdminArea) loginPath = '/admin/connexion';
      else if (isGarageArea) loginPath = '/garage/connexion';
      else if (isDriverArea) loginPath = '/login';
      
      // Use setTimeout to avoid React state update issues
      setTimeout(() => {
        router.replace(loginPath);
      }, 0);
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const hasRole = allowedRoles.includes(user.role);
      if (!hasRole) {
        debugLog('useRequireAuth: wrong role, redirecting to correct area');
        redirectAttempted.current = true;
        
        let redirectPath = '/';
        if (['superadmin', 'admin', 'agent'].includes(user.role)) {
          redirectPath = '/admin/tableau-de-bord';
        } else if (user.role === 'garage') {
          redirectPath = '/garage/tableau-de-bord';
        } else if (user.role === 'agency') {
          redirectPath = '/agence/tableau-de-bord';
        } else if (user.role === 'driver') {
          redirectPath = '/driver/tableau-de-bord';
        }
        
        setTimeout(() => {
          router.replace(redirectPath);
        }, 0);
      }
    }
  }, [user, loading, initialized, allowedRoles, router, pathname]);

  // Reset redirect flag when user changes
  useEffect(() => {
    redirectAttempted.current = false;
  }, [user?.id]);

  return { user, loading, initialized, logout, refreshSession, can, canAny };
}

// ============================================
// Hook for permission-based access
// ============================================
export function useRequirePermission(permission: Permission | Permission[]) {
  const { user, loading, initialized, can, canAny, logout, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Wait for initialization
    if (!initialized || loading) return;

    // Don't redirect on login pages
    if (isLoginPage(pathname)) return;

    // Prevent multiple redirects
    if (redirectAttempted.current) return;

    // Not authenticated
    if (!user) {
      redirectAttempted.current = true;
      const isAdminArea = pathname?.startsWith('/admin');
      router.replace(isAdminArea ? '/admin/connexion' : '/login');
      return;
    }

    // Check permission
    const permissions = Array.isArray(permission) ? permission : [permission];
    if (!canAny(permissions)) {
      redirectAttempted.current = true;
      
      let redirectPath = '/';
      if (['superadmin', 'admin', 'agent'].includes(user.role)) {
        redirectPath = '/admin/tableau-de-bord';
      } else if (user.role === 'garage') {
        redirectPath = '/garage/tableau-de-bord';
      } else if (user.role === 'driver') {
        redirectPath = '/driver/tableau-de-bord';
      }
      
      setTimeout(() => {
        router.replace(redirectPath);
      }, 0);
    }
  }, [user, loading, initialized, permission, canAny, router, pathname]);

  // Reset when user changes
  useEffect(() => {
    redirectAttempted.current = false;
  }, [user?.id]);

  return { user, loading, initialized, can, canAny, logout, refreshSession };
}

export default AuthContext;
