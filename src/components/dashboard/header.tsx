import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, LogOut, Loader2, DollarSign } from 'lucide-react';
import { UserProfile, ServiceOrder, Shop } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { fetchServiceOrders, fetchCurrentShop } from '@/lib/supabase/services';
import { CashRegisterModal } from '@/components/dashboard/cash-register-modal';

interface HeaderProps {
  user: UserProfile;
  onToggleSidebar?: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [cashOrders, setCashOrders] = useState<ServiceOrder[]>([]);
  const [cashShop, setCashShop] = useState<Shop | null>(null);
  const [loadingCash, setLoadingCash] = useState(false);

  const handleOpenCashRegister = async () => {
    setLoadingCash(true);
    setShowCashRegister(true);
    try {
      const [orders, shop] = await Promise.all([
        fetchServiceOrders(),
        fetchCurrentShop(),
      ]);
      setCashOrders(orders || []);
      setCashShop(shop);
    } catch (err) {
      console.error('Error al abrir arqueo de caja:', err);
    } finally {
      setLoadingCash(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 bg-surface border-b border-outline-variant flex justify-between items-center w-full h-16 px-gutter z-30 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {/* Botón de Menú Hamburguesa */}
        <button
          onClick={onToggleSidebar}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-container-high transition-all flex items-center justify-center border border-outline-variant/50"
          title="Abrir / Cerrar Menú"
        >
          <Menu className="w-5 h-5 text-primary" />
        </button>

        {/* Buscador Global */}
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar órdenes, clientes, DNI, IMEI o repuestos..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-full pl-9 pr-4 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
          />
        </div>
      </div>

      {/* Acciones del Header */}
      <div className="flex items-center gap-3">
        {/* Botón Cierre de Caja / Arqueo */}
        <button
          onClick={handleOpenCashRegister}
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Abrir Arqueo y Cierre de Caja del Día"
        >
          {loadingCash ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
          <span>Cierre de Caja</span>
        </button>

        {/* Botón Cerrar Sesión Real */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error hover:bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/50 transition-colors font-semibold disabled:opacity-50"
          title="Cerrar Sesión de forma segura"
        >
          {loggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-error" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span className="hidden md:inline">{loggingOut ? 'Cerrando...' : 'Salir'}</span>
        </button>
      </div>

      {/* MODAL DE CIERRE DE CAJA */}
      {showCashRegister && (
        <CashRegisterModal
          orders={cashOrders}
          shop={cashShop}
          onClose={() => setShowCashRegister(false)}
        />
      )}
    </header>
  );
}
