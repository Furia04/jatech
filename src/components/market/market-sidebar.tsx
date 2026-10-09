'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Store,
  Boxes,
  Layers,
  Wallet,
  ShoppingCart,
  BarChart3,
  ArrowLeft,
  X,
  BadgeCheck,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';
import { MarketUserContext } from '@/lib/supabase/market-services';
import { supabase } from '@/lib/supabase/client';

interface MarketSidebarProps {
  userContext?: MarketUserContext | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MarketSidebar({ userContext, isOpen = true, onClose }: MarketSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/market/login');
      router.refresh();
    } catch (e) {
      console.error('Error closing market session:', e);
    }
  }

  const navItems = [
    { href: '/market/catalog', label: 'Catálogo de Productos', icon: Boxes },
    { href: '/market/inventory', label: 'Stock e Inventario', icon: Layers },
    { href: '/market/pos', label: 'Punto de Venta (POS)', icon: ShoppingCart },
    { href: '/market/cash', label: 'Cajas y Turnos', icon: Wallet },
    { href: '/market/reports', label: 'Métricas y Reportes', icon: BarChart3 },
  ];

  const roleLabel =
    userContext?.marketRole === 'admin'
      ? 'Administrador'
      : userContext?.marketRole === 'manager'
      ? 'Encargado'
      : 'Cajero';

  return (
    <>
      {/* Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-950 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header con marca del Supermercado */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/market/catalog" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                NEXUS MARKET
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  BETA
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[140px]">
                Gestión Supermercado
              </div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1">
            Módulos del Comercio
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Perfil de usuario y botón de regreso */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Tarjeta de usuario */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userContext?.fullName || 'Usuario Conectado'}
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
