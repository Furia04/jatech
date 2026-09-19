'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/types';
import { Logo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  ShoppingBag,
  Smartphone,
  Settings,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/GestionTecnicos/dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { href: '/GestionTecnicos/orders', label: 'Órdenes de Servicio', icon: Wrench },
    { href: '/GestionTecnicos/part-orders', label: 'Pedidos de Repuestos', icon: ShoppingBag },
    { href: '/GestionTecnicos/inventory', label: 'Inventario', icon: Package },
    { href: '/GestionTecnicos/customers', label: 'Clientes', icon: Users },
    { href: '/GestionTecnicos/devices', label: 'Dispositivos', icon: Smartphone },
    { href: '/GestionTecnicos/settings', label: 'Configuración', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed h-full w-sidebar-width left-0 top-0 border-r border-outline-variant bg-surface-container flex flex-col z-50 animate-in slide-in-from-left duration-200 shadow-2xl">
        {/* Encabezado con Logo Minimalista */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <Link href="/GestionTecnicos/dashboard" onClick={onClose}>
            <Logo size={36} textSubtitle="Sucursal Norte" />
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Cerrar Menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body-md transition-colors ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Perfil del Usuario e Indicador RBAC */}
        <div className="p-4 border-t border-outline-variant mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-low border border-outline-variant/40">
            <div className="w-9 h-9 rounded-full bg-primary-container/30 border border-primary/40 flex items-center justify-center text-primary">
              {user.role === 'owner' ? <ShieldAlert className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-title-sm text-xs font-semibold text-on-surface truncate">
                {user.full_name || user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-label-caps text-[10px] text-primary uppercase font-bold px-1.5 py-0.5 bg-primary/10 rounded">
                  {user.role === 'owner' ? 'Dueño' : 'Técnico'}
                </span>
                {user.can_view_financials && (
                  <span className="font-label-caps text-[9px] text-emerald-400 font-bold" title="Acceso a Costos y Rentabilidad">
                    $ Finanzas
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
