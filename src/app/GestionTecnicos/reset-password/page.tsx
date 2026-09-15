'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/GestionTecnicos/update-password`,
      });

      if (error && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Logo size={40} textSubtitle="Recuperación de Cuenta" />
          </Link>
          <h2 className="font-title-sm text-xl font-bold text-on-surface pt-3">
            Recuperar Contraseña
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Ingresa tu correo registrado y te enviaremos las instrucciones de recuperación.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <h3 className="font-title-sm text-base font-bold text-on-surface">
              ¡Correo Enviado!
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Revisa la bandeja de entrada de <strong>{email}</strong>. Te hemos enviado un enlace seguro para reestablecer tu clave.
            </p>
            <Link
              href="/GestionTecnicos/login"
              className="inline-block pt-2 font-title-sm text-xs text-primary font-bold hover:underline"
            >
              ← Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                Correo Electrónico Registrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@taller.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary hover:bg-primary-container font-title-sm text-sm font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? 'Enviando Correo...' : 'Enviar Enlace de Recuperación'}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center border-t border-outline-variant/40 pt-4">
          <Link href="/GestionTecnicos/login" className="font-body-sm text-xs text-on-surface-variant hover:text-primary">
            ¿Recordaste tu contraseña? <strong className="text-primary font-bold">Iniciar Sesión</strong>
          </Link>
        </div>
      </div>
    </div>
  );
}
