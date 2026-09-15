'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Shop, UserProfile } from '@/types';
import { getCurrentUserProfile } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import {
  Lock,
  AlertTriangle,
  CreditCard,
  Building2,
  Check,
  Copy,
  MessageSquare,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAlias, setCopiedAlias] = useState(false);

  const loadUserAndShopStatus = async () => {
    setLoading(true);
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push('/GestionTecnicos/login');
        return;
      }

      setUserProfile(profile);

      const shopId = profile.shop_id || profile.id;
      const cleanEmail = (profile.email || '').toLowerCase();

      // Consultar taller real desde la base de datos Supabase
      const { data: dbShop } = await supabase
        .from('shops')
        .select('*')
        .or(`id.eq.${shopId},owner_email.eq.${cleanEmail}`)
        .maybeSingle();

      if (dbShop) {
        setUserShop({
          id: dbShop.id,
          name: dbShop.name || 'Mi Taller',
          owner_email: dbShop.owner_email || profile.email,
          subscription_status: dbShop.subscription_status || 'pending_payment',
          plan_price: Number(dbShop.plan_price) || 20000,
          active: dbShop.active ?? false,
          created_at: dbShop.created_at || new Date().toISOString(),
        });
      } else {
        setUserShop({
          id: shopId,
          name: profile.full_name ? `Taller de ${profile.full_name}` : 'Mi Taller',
          owner_email: profile.email,
          subscription_status: 'pending_payment',
          plan_price: 20000,
          active: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error al verificar estado de taller en Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndShopStatus();
  }, []);

  const isSuspended = userShop
    ? (userShop.active === false && (userShop.subscription_status === 'canceled' || userShop.subscription_status === 'past_due'))
    : false;

  const isPendingPayment = userShop
    ? (userShop.active === false && userShop.subscription_status === 'pending_payment')
    : false;

  if (loading || !userProfile) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-body-sm text-xs text-on-surface-variant">Verificando sesión segura...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface font-sans">
      {/* Sidebar Desplegable */}
      <Sidebar
        user={userProfile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          user={userProfile}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-container-margin bg-surface-container-lowest relative">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-body-sm text-xs">Consultando suscripción en Supabase...</p>
            </div>
          ) : isSuspended ? (
            /* CASO 1: PANTALLA DE TALLER SUSPENDIDO */
            <div className="max-w-2xl mx-auto my-8 bg-surface-container border-2 border-error/40 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-error/20 text-error flex items-center justify-center mx-auto border border-error/30 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="font-label-caps text-xs text-error font-bold uppercase tracking-widest">
                  Acceso Restringido
                </span>
                <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface">
                  Tu Taller Se Encuentra Suspendido
                </h2>
                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
                  El acceso a las órdenes de servicio, inventario y datos ha sido suspendido desde el panel de administración por falta de pago o baja de membresía ($20.000 ARS/mes).
                </p>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 text-left space-y-3 font-mono-data text-xs">
                <div className="text-on-surface-variant text-[10px] uppercase font-bold">Datos para Reactivación por Transferencia:</div>
                <div className="flex justify-between items-center bg-surface-container p-3 rounded-xl border border-outline-variant/40">
                  <div>
                    <div className="text-on-surface font-bold text-sm">JATECH.OPS.MP</div>
                    <div className="text-on-surface-variant text-[10px]">MercadoPago / CBU • Titular: JaTech Software SRL</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('JATECH.OPS.MP');
                      setCopiedAlias(true);
                      setTimeout(() => setCopiedAlias(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-surface-bright text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-highest text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                    {copiedAlias ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/checkout${userShop?.id ? `?shop_id=${userShop.id}` : ''}`}
                  className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Reactivar con Mercado Pago ($20.000)
                </Link>
                <button
                  onClick={loadUserAndShopStatus}
                  className="flex-1 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface font-title-sm text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-primary" /> Ya pagué, verificar
                </button>
              </div>

              <div className="text-center pt-1 border-t border-outline-variant/40">
                <a
                  href={`https://wa.me/?text=Hola,%20les%20escribo%20porque%20mi%20taller%20(${userShop?.name || 'Taller'})%20se%20encuentra%20suspendido%20y%20ya%20realicé%20la%20transferencia%20de%20%2420.000.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-emerald-400 font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> ¿Pagaste por transferencia? Notificar por WhatsApp
                </a>
              </div>
            </div>
          ) : isPendingPayment ? (
            /* CASO 2: PANTALLA DE PRIMER PAGO PARA USUARIO NUEVO */
            <div className="max-w-2xl mx-auto my-8 bg-surface-container border-2 border-primary/40 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto border border-primary/30 shadow-inner">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="font-label-caps text-xs text-primary font-bold uppercase tracking-widest">
                  Activación Inicial Requerida
                </span>
                <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface">
                  ¡Bienvenido a JaTech!
                </h2>
                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
                  Para ingresar por primera vez a tu panel y emitir órdenes de servicio con comanda de 80mm, completa el pago inicial de tu membresía ($20.000 ARS/mes).
                </p>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 text-left space-y-3 font-mono-data text-xs">
                <div className="text-on-surface-variant text-[10px] uppercase font-bold">Transferencia Bancaria Directa:</div>
                <div className="flex justify-between items-center bg-surface-container p-3 rounded-xl border border-outline-variant/40">
                  <div>
                    <div className="text-on-surface font-bold text-sm">JATECH.OPS.MP</div>
                    <div className="text-on-surface-variant text-[10px]">MercadoPago / CBU • $20.000 ARS</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('JATECH.OPS.MP');
                      setCopiedAlias(true);
                      setTimeout(() => setCopiedAlias(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-surface-bright text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-highest text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                    {copiedAlias ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/GestionTecnicos/checkout"
                  className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Ir a Pasarela de Pago ($20.000)
                </Link>
                <button
                  onClick={loadUserAndShopStatus}
                  className="flex-1 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface font-title-sm text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-primary" /> Ya pagué, verificar
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
