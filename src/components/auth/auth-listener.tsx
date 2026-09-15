'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/GestionTecnicos/update-password');
      }
    });

    // Detectar si la URL trae el fragmento de recuperación (#type=recovery)
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      router.push('/GestionTecnicos/update-password');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
