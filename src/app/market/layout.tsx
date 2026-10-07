'use client';

import React, { useState, useEffect } from 'react';
import { MarketSidebar } from '@/components/market/market-sidebar';
import { getMarketUserContext, MarketUserContext } from '@/lib/supabase/market-services';
import { Menu, Store, Loader2 } from 'lucide-react';

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userContext, setUserContext] = useState<MarketUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadContext() {
      try {
        const ctx = await getMarketUserContext();
        setUserContext(ctx);
      } catch (e) {
        console.error('Error loading market user context:', e);
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, []);

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
