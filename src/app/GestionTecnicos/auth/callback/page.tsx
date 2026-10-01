'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta e iniciando tu panel de taller...');

  useEffect(() => {
    async function processAuth() {
      try {
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        // Si viene error en la URL
        if (error || errorCode || errorDescription) {
          if (errorCode === 'otp_expired') {
            setStatus('error');
            setMessage('El enlace de confirmación ha expirado. Por favor solicita uno nuevo desde la pantalla de ingreso.');
            setTimeout(() => router.push('/GestionTecnicos/login?error=otp_expired'), 2500);
            return;
          }
          setStatus('error');
          setMessage(decodeURIComponent(errorDescription || error || 'Error de autenticación.'));
          setTimeout(() => router.push('/GestionTecnicos/login'), 2500);
          return;
        }

        // Obtener usuario autenticado o sesión activa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          // Intentar refresh de usuario
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.push('/GestionTecnicos/login');
            return;
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const cleanEmail = (user.email || '').toLowerCase().trim();
          const fullName = user.user_metadata?.full_name || cleanEmail;
          const shopName = user.user_metadata?.shop_name || `Taller de ${fullName}`;

          // Auto-provisionar o enlazar taller en Supabase
          try {
            const { data: existingShop } = await supabase
              .from('shops')
              .select('id')
              .or(`id.eq.${user.id},owner_email.eq.${cleanEmail}`)
              .maybeSingle();

            const targetShopId = existingShop?.id || user.id;

            if (!existingShop) {
              const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
              await supabase.from('shops').insert([{
                id: targetShopId,
                name: shopName,
                owner_email: cleanEmail,
                subscription_status: 'trialing',
                trial_ends_at: trialEndsAt,
                plan_price: 20000,
                active: true,
              }]);
            }

            await supabase.from('users').upsert([{
              id: user.id,
              email: cleanEmail,
              full_name: fullName,
              role: 'owner',
              shop_id: targetShopId,
              can_view_financials: true,
            }], { onConflict: 'id' });
          } catch (provisionErr) {
            console.warn('Auto-provisioning warning:', provisionErr);
          }

          setStatus('success');
          setMessage('¡Cuenta confirmada con éxito! Redirigiendo a tu panel...');
          setTimeout(() => {
            router.push('/GestionTecnicos/dashboard');
            router.refresh();
          }, 800);
        } else {
          router.push('/GestionTecnicos/login');
        }
      } catch (err: any) {
        console.error('Error en callback de autenticación:', err);
        setStatus('error');
        setMessage('Ocurrió un inconveniente al validar la sesión. Redirigiendo al login...');
        setTimeout(() => router.push('/GestionTecnicos/login'), 2000);
      }
    }

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h2 className="font-title-sm text-lg font-bold text-on-surface">Validando tu cuenta...</h2>
            <p className="font-body-sm text-xs text-on-surface-variant">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="font-title-sm text-lg font-bold text-on-surface">¡Acceso Confirmado!</h2>
            <p className="font-body-sm text-xs text-on-surface-variant">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-error mx-auto" />
            <h2 className="font-title-sm text-lg font-bold text-error">Enlace no disponible</h2>
            <p className="font-body-sm text-xs text-on-surface-variant">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
