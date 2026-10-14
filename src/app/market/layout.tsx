'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MarketSidebar } from '@/components/market/market-sidebar';
import { MarketLogo } from '@/components/ui/market-logo';
import { getMarketUserContext, MarketUserContext } from '@/lib/supabase/market-services';
import { supabase } from '@/lib/supabase/client';
import { Menu, Loader2, Lock, ArrowRight, Wrench, CreditCard } from 'lucide-react';

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userContext, setUserContext] = useState<MarketUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleRestricted, setModuleRestricted] = useState(false);

  useEffect(() => {
    // Si estamos en login o checkout, no forzar restricciones
    if (pathname === '/market/login' || pathname === '/market/checkout') {
      setLoading(false);
      return;
    }

    async function loadContext() {
      try {
        const ctx = await getMarketUserContext();
        if (ctx) {
          setUserContext(ctx);

          // Verificar si el usuario es superadmin (pase libre)
          const isSuperAdmin =
            ctx.email === 'furiaortiz04@gmail.com' ||
            ctx.role === 'superadmin' ||
            process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL === ctx.email;

          if (!isSuperAdmin) {
            // Consultar el módulo asignado a su comercio en Supabase
            const { data: shop } = await supabase
              .from('shops')
              .select('subscription_module, subscription_status, active')
              .eq('id', ctx.shopId)
              .maybeSingle();

            if (shop) {
              // Si la tienda solo tiene módulo de taller ("workshop") y no "market" ni "both"
              if (shop.subscription_module === 'workshop') {
                setModuleRestricted(true);
              }
            }
          }
        } else {
          // Sesión fallback local para pruebas offline
          setUserContext({
            userId: 'local-user',
            shopId: 'local-shop',
            email: 'admin@jatechmarket.local',
            fullName: 'Cajero / Administrador Local',
            role: 'owner',
            marketRole: 'admin',
          });
        }
      } catch (e) {
        console.warn('Operando en modo local resiliente:', e);
        setUserContext({
          userId: 'local-user',
          shopId: 'local-shop',
          email: 'admin@jatechmarket.local',
          fullName: 'Cajero / Administrador Local',
          role: 'owner',
          marketRole: 'admin',
        });
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, [pathname, router]);

  // Si es la página de login o checkout, renderizar sin el sidebar
  if (pathname === '/market/login' || pathname === '/market/checkout') {
    return <>{children}</>;
  }

  // Loader de autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-300">
            Cargando entorno de Supermercado...
          </span>
        </div>
      </div>
    );
  }

  // Pantalla de bloqueo si el usuario solo pagó el SaaS de Técnicos
  if (moduleRestricted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block font-semibold">
              Módulo No Habilitado
            </span>
            <h1 className="text-xl font-bold text-white">
              Acceso Exclusivo a Gestión Técnicos
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu cuenta tiene contratada una membresía para el software de <strong>Servicio Técnico y Talleres</strong>. Para habilitar el Punto de Venta (POS) y Cajas, suscríbete al Plan Market Retail.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/market/checkout"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Suscribirme al Plan Market Retail ($25.000)</span>
            </Link>

            <Link
              href="/GestionTecnicos/dashboard"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Ir a mi Panel de Taller (Gestión Técnicos)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar para Escritorio y Móvil */}
      <MarketSidebar
        userContext={userContext}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        {/* Topbar móvil */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between p-3.5 bg-slate-950/90 backdrop-blur border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <MarketLogo size="sm" />
          <div className="w-9" />
        </header>

        {/* Vista hija */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
