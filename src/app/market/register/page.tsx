'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building2, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { MarketLogo } from '@/components/ui/market-logo';
import { supabase } from '@/lib/supabase/client';

function MarketRegisterForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanShopName = shopName.trim();
      const cleanFullName = fullName.trim();

      // 1. Registro en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            role: 'owner',
            market_role: 'admin',
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || 'Error al crear usuario.');
      }

      const user = authData?.user;
      if (!user) {
        throw new Error('No se pudo completar el registro de usuario.');
      }

      // 2. Crear la tienda en Supabase
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert([{
          name: cleanShopName,
          owner_email: cleanEmail,
          subscription_module: 'market',
          subscription_status: 'trialing',
          plan_price: 25000,
          active: true,
        }])
        .select()
        .single();

      const shopId = shopData?.id || user.id;

      // 3. Crear perfil de usuario en la tabla users
      await supabase
        .from('users')
        .upsert([{
          id: user.id,
          shop_id: shopId,
          email: cleanEmail,
          full_name: cleanFullName,
          role: 'owner',
          market_role: 'admin',
        }]);

      setSuccessMessage(true);
      setTimeout(() => {
        router.push('/market/pos');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Error registrando comercio:', err);
      setErrorMessage(err.message || 'Error inesperado al crear la cuenta.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Cabecera / Identidad de Marca */}
        <div className="flex flex-col items-center text-center mb-8">
          <MarketLogo size="lg" className="mb-3" />
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
            Sistema integral de Punto de Venta (POS), control de stock inteligente, arqueo de cajas y gestión comercial.
          </p>
        </div>

        {/* Tarjeta de Registro */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Registrar Nuevo Comercio</h2>
            <p className="text-xs text-slate-400">
              Crea tu cuenta de comercio y comienza a operar tu Punto de Venta de inmediato.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              <span className="font-bold text-sm">¡Comercio registrado con éxito!</span>
              <span className="text-slate-300">Ingresando a tu panel de punto de venta...</span>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nombre del Comercio / Supermercado
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ej: Autoservicio Don Mario"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nombre del Administrador / Dueño
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mario González"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="comercio@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando comercio...</span>
                  </>
                ) : (
                  <>
                    <span>Comenzar a Gestionar mi Comercio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Enlace hacia Iniciar Sesión */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <span className="text-xs text-slate-400">¿Ya tienes una cuenta registrada? </span>
            <Link
              href="/market/login"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <MarketRegisterForm />
    </Suspense>
  );
}
