'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // 1. Autenticar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError || !authData.user) {
        setErrorMessage('Credenciales incorrectas en Supabase.');
        setLoading(false);
        return;
      }

      const user = authData.user;

      // 2. VERIFICACIÓN DE SEGURIDAD DE ROL SUPERADMIN
      let isSuperAdmin = false;

      // a) Lista explícita de correos del dueño del SaaS
      const allowedAdminEmails = [
        'furiaortiz04@gmail.com',
        'admin@prorepair.com',
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
      ].filter(Boolean);

      if (allowedAdminEmails.includes(user.email)) {
        isSuperAdmin = true;
      }

      // b) Verificar en user_metadata
      if (user.user_metadata?.role === 'superadmin') {
        isSuperAdmin = true;
      }

      // c) Verificar en tabla pública 'users'
      if (!isSuperAdmin) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'superadmin') {
          isSuperAdmin = true;
        }
      }

      // 3. SI NO ES SUPERADMIN, DENEGAR ACCESO Y CERRAR SESIÓN
      if (!isSuperAdmin) {
        await supabase.auth.signOut();
        setErrorMessage('ACCESO DENEGADO: Tu cuenta no tiene permisos de Super Administrador.');
        setLoading(false);
        return;
      }

      // 4. REDIRIGIR A PANEL SUPERADMIN CON SESIÓN AUTÉNTICA
      router.push('/GestionTecnicos/admin');
      router.refresh();
    } catch (err: any) {
      setErrorMessage('Error al verificar privilegios de administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Logo size={42} textSubtitle="Control de Acceso SaaS" />
          </Link>
          <div className="pt-2 flex items-center justify-center gap-1.5 text-purple-400 font-label-caps text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Portal de Super Administrador
          </div>
          <h1 className="font-title-sm text-xl font-bold text-on-surface">
            Autenticación Administrador
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Acceso estrictamente restringido al dueño de la plataforma JaTech.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
              Email del Super Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
              Contraseña de Supabase
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-mono-data text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-title-sm text-sm font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Verificando Privilegios...' : 'Validar & Ingresar'}
          </button>
        </form>

        <div className="text-center border-t border-outline-variant/40 pt-4">
          <Link href="/GestionTecnicos/login" className="font-body-sm text-xs text-on-surface-variant hover:text-primary">
            ← Volver al login normal de taller
          </Link>
        </div>
      </div>
    </div>
  );
}
