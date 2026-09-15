'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMessage(error.message || 'Error al actualizar la contraseña.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/GestionTecnicos/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión al actualizar contraseña.');
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
            <Logo size={40} textSubtitle="Restablecer Contraseña" />
          </Link>
          <h2 className="font-title-sm text-xl font-bold text-on-surface pt-3">
            Crear Nueva Contraseña
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Ingresa tu nueva contraseña para acceder a tu taller.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <h3 className="font-title-sm text-base font-bold text-on-surface">
              ¡Contraseña Actualizada!
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Tu clave se ha actualizado correctamente. Redirigiendo a tu panel...
            </p>
            <Link
              href="/GestionTecnicos/dashboard"
              className="inline-flex items-center gap-1.5 pt-2 font-title-sm text-xs text-primary font-bold hover:underline"
            >
              Ir al Panel <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Actualizando contraseña...
                </>
              ) : (
                'Guardar Nueva Contraseña'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
