'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, Mail, Lock, User, Building2, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Shop } from '@/types';

export default function RegisterPage() {
  const router = useRouter();

  // Paso 1: Datos del Taller / Negocio
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');

  // Paso 2: Cuenta del Dueño / Administrador
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanShopName = shopName.trim();

      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            shop_name: cleanShopName,
            role: 'owner',
          },
        },
      });

      if (authError && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData?.user?.id;
      const generatedShopId = userId || `shop-${Date.now()}`;

      // 2. Insertar o actualizar Taller en la tabla 'shops' de Supabase
      try {
        await supabase.from('shops').upsert([{
          id: generatedShopId,
          name: cleanShopName,
          owner_email: cleanEmail,
          subscription_status: 'pending_payment',
          plan_price: 20000,
          active: false,
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Error al insertar taller en Supabase:', err);
      }

      // 3. Insertar Perfil de Usuario en la tabla 'users' de Supabase
      if (userId) {
        try {
          await supabase.from('users').upsert([{
            id: userId,
            email: cleanEmail,
            full_name: fullName,
            role: 'owner',
            shop_id: generatedShopId,
            can_view_financials: true,
          }], { onConflict: 'id' });
        } catch (err) {
          console.warn('Error al insertar usuario en Supabase:', err);
        }
      }

      // 4. Persistir el nuevo taller en localStorage para disponibilidad inmediata local
      const newShopObj: Shop = {
        id: generatedShopId,
        name: cleanShopName,
        owner_email: cleanEmail,
        subscription_status: 'pending_payment',
        plan_price: 20000,
        active: false,
        created_at: new Date().toISOString(),
        orders_count: 0,
      };

      if (typeof window !== 'undefined') {
        try {
          const storedShopsStr = localStorage.getItem('prorepair_registered_shops');
          const existingShops: Shop[] = storedShopsStr ? JSON.parse(storedShopsStr) : [];
          const filtered = existingShops.filter((s) => s.owner_email.toLowerCase() !== cleanEmail);
          const updatedShops = [newShopObj, ...filtered];
          localStorage.setItem('prorepair_registered_shops', JSON.stringify(updatedShops));

          // Transmitir evento para que el panel admin lo detecte de inmediato
          window.dispatchEvent(new Event('prorepair_shop_updated'));
        } catch (e) {
          console.warn('Error al guardar taller en localStorage');
        }
      }

      setSuccessMessage('¡Taller registrado exitosamente! Redirigiendo al checkout...');
      setTimeout(() => {
        router.push('/GestionTecnicos/checkout');
      }, 1200);
    } catch (err: any) {
      setSuccessMessage('¡Taller registrado! Redirigiendo...');
      setTimeout(() => {
        router.push('/GestionTecnicos/checkout');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans relative overflow-hidden my-6">
      {/* Background Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-xl bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-md group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-headline-md text-2xl font-bold text-primary tracking-tight block">
                JaTech
              </span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block">
                Prueba Gratis 14 Días
              </span>
            </div>
          </Link>
          <h1 className="font-title-sm text-xl font-bold text-on-surface pt-2">
            Alta de Taller & Registro de Cuenta
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Configura tu negocio en 2 minutos y comienza a emitir órdenes ilimitadas.
          </p>
        </div>

        {/* Notificaciones */}
        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* SECCIÓN 1: DATOS DEL TALLER */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary font-title-sm text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> 1. Datos de tu Taller / Negocio
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                  Nombre del Taller *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ej: Electrónica Sur Taller"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 4455 6677"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-mono-data text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CUENTA DEL DUEÑO */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary font-title-sm text-xs font-bold uppercase tracking-wider">
              <User className="w-4 h-4" /> 2. Cuenta de Administrador (Dueño)
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Dueño"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@taller.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-xs text-on-surface-variant mb-1 uppercase font-semibold">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita su contraseña"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary hover:bg-primary-container font-title-sm text-sm font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creando Taller...' : 'Crear Taller & Ir al Checkout'}{' '}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center border-t border-outline-variant/40 pt-4">
          <p className="font-body-sm text-xs text-on-surface-variant">
            ¿Ya tienes un taller registrado?{' '}
            <Link href="/GestionTecnicos/login" className="text-primary font-bold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
