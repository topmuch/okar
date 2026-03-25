'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GarageRootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.replace('/garage/connexion');
      return;
    }

    // If user is a garage, redirect to dashboard
    if (user.role === 'garage') {
      router.replace('/garage/tableau-de-bord');
    } else if (['superadmin', 'admin', 'agent'].includes(user.role)) {
      // Admin users go to admin dashboard
      router.replace('/admin/tableau-de-bord');
    } else {
      // Other users go to agency dashboard
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm">Vérification de l&apos;authentification...</p>
      </div>
    </div>
  );
}
