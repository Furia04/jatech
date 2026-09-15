'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (searchParams.get('reset') === 'true') {
      router.push('/GestionTecnicos/update-password');
      return;
    }

    if (errorCode === 'otp_expired' || (typeof window !== 'undefined' && window.location.hash.includes('otp_expired'))) {
      setErrorMessage('El enlace de recuperación ha expirado o ya fue utilizado. Por favor solicita uno nuevo.');
    } else if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
    } else if (error) {
      setErrorMessage('Ocurrió un error al procesar la autenticación.');
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Credenciales inválidas.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMessage('No se encontró el usuario.');
        setLoading(false);
        return;
      }

      router.push('/GestionTecnicos/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header Limpio */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Logo size={42} />
          </Link>
          <h1 className="font-title-sm text-2xl font-bold text-on-surface pt-3">
            Iniciar Sesión
          </h1>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
              Ingresar correo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresar correo"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                Ingresar contraseña
              </label>
              <Link
                href="/GestionTecnicos/reset-password"
                className="font-body-sm text-xs text-primary hover:underline font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresar contraseña"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-10 pr-4 font-mono-data text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary hover:bg-primary-container font-title-sm text-sm font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Ingresando...' : 'Iniciar Sesión'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center border-t border-outline-variant/40 pt-4">
          <p className="font-body-sm text-xs text-on-surface-variant">
            ¿No tienes cuenta aún?{' '}
            <Link href="/GestionTecnicos/register" className="text-primary font-bold hover:underline">
              Registrar Taller Gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

