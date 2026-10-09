'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MarketSidebar } from '@/components/market/market-sidebar';
import { getMarketUserContext, MarketUserContext } from '@/lib/supabase/market-services';
import { Menu, Store, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    // Si estamos en la página de login, no forzar redirección
    if (pathname === '/market/login') {
      setLoading(false);
      return;
    }

    async function loadContext() {
      try {
        const ctx = await getMarketUserContext();
        setUserContext(ctx);
        if (!ctx) {
          router.push(`/market/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (e) {
        console.error('Error loading market user context:', e);
        router.push(`/market/login?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, [pathname, router]);

  // Si es la página de login, renderizar únicamente el contenido sin el layout de la app
  if (pathname === '/market/login') {
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white">NEXUS MARKET</span>
          </div>
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
