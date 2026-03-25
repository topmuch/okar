'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminRootPage() {
  const router = useRouter();
  const { user, loading, isSuperAdmin, isAdmin, isAgent } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.replace('/admin/connexion');
      return;
    }

    // If user has admin access, redirect to dashboard
    if (isSuperAdmin || isAdmin || isAgent) {
      router.replace('/admin/tableau-de-bord');
    } else {
      // User is authenticated but not admin - redirect to their area
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, loading, isSuperAdmin, isAdmin, isAgent, router]);

  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm">Vérification de l&apos;authentification...</p>
      </div>
    </div>
  );
}
