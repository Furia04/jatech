'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Lock,
  Unlock,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  LogOut,
  Plus,
  X,
  Save,
  Store,
  Trash2,
} from 'lucide-react';
import { Shop } from '@/types';
import { fetchAllShopsForAdmin, updateShopSubscriptionStatus, deleteShopAsAdmin } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedShopId, setCopiedShopId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal para agregar taller manualmente desde el Admin directamente a Supabase
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Modal para eliminar taller permanentemente
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadShops = async () => {
    setLoading(true);
    try {
      const realShops = await fetchAllShopsForAdmin();
      setShops(realShops || []);
    } catch (err) {
      console.error('Error al cargar talleres reales de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function verifySuperAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/GestionTecnicos/admin/login');
          return;
        }

        let isSuperAdmin =
          user.user_metadata?.role === 'superadmin' ||
          user.email === 'furiaortiz04@gmail.com' ||
          (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL);

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

        if (!isSuperAdmin) {
          router.push('/GestionTecnicos/admin/login?error=unauthorized');
          return;
        }

        setAuthorized(true);
        loadShops();
      } catch (err) {
        console.error('Error al validar sesión de SuperAdmin:', err);
        router.push('/GestionTecnicos/admin/login');
      }
    }

    verifySuperAdmin();
  }, [router]);

  const handleAdminLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('Error al salir del admin:', e);
    }
    router.push('/GestionTecnicos/admin/login');
    router.refresh();
  };

  const handleToggleActiveStatus = async (shop: Shop) => {
    setActionLoadingId(shop.id);
    const newActive = !shop.active;
    const newStatus = newActive ? 'active' : 'canceled';

    try {
      await updateShopSubscriptionStatus(shop.id, newStatus, newActive);
      await loadShops();
    } catch (err) {
      console.error('Error al actualizar estado en Supabase:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAsPaid = async (shop: Shop) => {
    setActionLoadingId(shop.id);
    try {
      await updateShopSubscriptionStatus(shop.id, 'active', true);
      await loadShops();
    } catch (err) {
      console.error('Error al marcar pagado en Supabase:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newOwnerEmail.trim()) return;

    setModalLoading(true);
    const cleanEmail = newOwnerEmail.trim().toLowerCase();
    const cleanName = newShopName.trim();

    try {
      let saved = false;
      try {
        const res = await fetch('/api/admin/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            owner_email: cleanEmail,
            subscription_status: 'active',
            plan_price: 20000,
            active: true,
          }),
        });
        if (res.ok) {
          saved = true;
        }
      } catch (apiErr) {
        console.warn('Fallback a inserción directa Supabase:', apiErr);
      }

      if (!saved) {
        const { error } = await supabase
          .from('shops')
          .insert([{
            name: cleanName,
            owner_email: cleanEmail,
            subscription_status: 'active',
            plan_price: 20000,
            active: true,
          }]);

        if (error) {
          console.error('Error al insertar taller en Supabase:', error);
        }
      }

      await loadShops();
      setNewShopName('');
      setNewOwnerEmail('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteShopAsAdmin(shopToDelete.id);
      setShops((prev) => prev.filter((s) => s.id !== shopToDelete.id));
      setShopToDelete(null);
      setDeleteConfirmText('');
    } catch (err: any) {
      console.error('Error al eliminar taller:', err);
      setDeleteError(err.message || 'Error al eliminar el taller.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-on-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.active && s.subscription_status === 'active').length;
  const pendingShops = shops.filter((s) => !s.active || s.subscription_status === 'pending_payment').length;
  const estimatedMonthlySaaSRevenue = shops
    .filter((s) => s.active && s.subscription_status === 'active')
    .reduce((acc, s) => acc + (s.plan_price || 20000), 0);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      {/* HEADER SUPER ADMIN */}
      <header className="bg-surface-container border-b border-outline-variant px-6 h-20 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo size={40} textSubtitle="Panel de Control del Dueño (SaaS Admin)" />
          </Link>
          <span className="bg-purple-900/40 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Super Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Alta Manual Taller
          </button>

          <button
            onClick={loadShops}
            className="p-2 bg-surface-bright text-on-surface hover:bg-surface-container-highest rounded-xl border border-outline-variant transition-colors"
            title="Recargar Lista de Talleres de Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleAdminLogout}
            className="bg-error/20 hover:bg-error/30 text-error border border-error/30 px-3.5 py-1.5 rounded-xl font-title-sm text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Salir del Admin
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="font-display-lg text-3xl font-bold text-on-surface">
            Control Global de Talleres y Suscripciones
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Datos reales obtenidos en tiempo real de tu base de datos Supabase.
          </p>
        </div>

        {/* MÉTRICAS CLAVE DEL SAAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
              TOTAL TALLERES EN SUPABASE
            </span>
            <div className="font-display-lg text-3xl font-bold text-on-surface font-mono-data">
              {totalShops}
            </div>
            <span className="text-[11px] text-on-surface-variant">Talleres en la base de datos</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
            <span className="font-label-caps text-xs text-emerald-400 uppercase font-semibold">
              TALLERES ACTIVOS (PAGADOS)
            </span>
            <div className="font-display-lg text-3xl font-bold text-emerald-400 font-mono-data">
              {activeShops}
            </div>
            <span className="text-[11px] text-on-surface-variant">Acceso habilitado al taller</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
            <span className="font-label-caps text-xs text-amber-400 uppercase font-semibold">
              PENDIENTES DE PAGO / SUSPENDIDOS
            </span>
            <div className="font-display-lg text-3xl font-bold text-amber-400 font-mono-data">
              {pendingShops}
            </div>
            <span className="text-[11px] text-on-surface-variant">Acceso bloqueado en pasarela</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
            <span className="font-label-caps text-xs text-primary uppercase font-semibold">
              INGRESOS MENSUALES ESTIMADOS
            </span>
            <div className="font-display-lg text-3xl font-bold text-primary font-mono-data">
              ${estimatedMonthlySaaSRevenue.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-on-surface-variant">Calculado sobre talleres activos reales</span>
          </div>
        </div>

        {/* TABLA DE GESTIÓN DE TALLERES */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-xl space-y-4">
          <div className="p-5 border-b border-outline-variant bg-surface-container-high flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Talleres Registrados en Supabase ({shops.length})
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre de taller o email..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 pl-9 pr-3 text-xs text-on-surface"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs">Consultando base de datos Supabase...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant border border-outline-variant/50">
                <Store className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-title-sm text-base font-bold text-on-surface">
                  No hay talleres registrados en la base de datos
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  {searchQuery
                    ? 'No se encontraron resultados para tu búsqueda.'
                    : 'Aún no se han registrado talleres en tu base de datos Supabase.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary text-on-primary font-title-sm text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" /> Crear Primer Taller
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="bg-surface-container-highest border-b border-outline-variant font-label-caps text-on-surface-variant uppercase">
                  <tr>
                    <th className="p-4">Taller / Negocio</th>
                    <th className="p-4">Email Dueño</th>
                    <th className="p-4">Fecha Registro</th>
                    <th className="p-4 text-center">Órdenes Generadas</th>
                    <th className="p-4">Estado Suscripción</th>
                    <th className="p-4 text-center">Acceso Plataforma</th>
                    <th className="p-4 text-right">Acciones de Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 font-mono-data">
                  {filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-surface-container-high transition-colors">
                      <td className="p-4 font-sans font-bold text-on-surface text-sm">
                        {shop.name}
                      </td>
                      <td className="p-4 text-on-surface-variant font-semibold">{shop.owner_email}</td>
                      <td className="p-4 text-on-surface-variant">
                        {shop.created_at ? new Date(shop.created_at).toLocaleDateString('es-AR') : 'Reciente'}
                      </td>
                      <td className="p-4 font-bold text-primary text-center">
                        {shop.orders_count ?? 0}
                      </td>
                      <td className="p-4">
                        {shop.subscription_status === 'active' && shop.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Pagado (${Number(shop.plan_price || 20000).toLocaleString('es-AR')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Pendiente de Pago
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          disabled={actionLoadingId === shop.id}
                          onClick={() => handleToggleActiveStatus(shop)}
                          className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 mx-auto text-[11px] disabled:opacity-50 ${
                            shop.active
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                              : 'bg-error/20 text-error border border-error/30 hover:bg-error/30'
                          }`}
                        >
                          {actionLoadingId === shop.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : shop.active ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Habilitado
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Suspendido / Bloqueado
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!shop.active || shop.subscription_status !== 'active' ? (
                          <button
                            disabled={actionLoadingId === shop.id}
                            onClick={() => handleMarkAsPaid(shop)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-sm transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === shop.id ? 'Guardando...' : '✓ Aprobar Pago & Activar'}
                          </button>
                        ) : (
                          <button
                            disabled={actionLoadingId === shop.id}
                            onClick={() => handleToggleActiveStatus(shop)}
                            className="bg-error/20 hover:bg-error/30 text-error font-bold px-3 py-1 rounded-lg text-[11px] transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === shop.id ? 'Guardando...' : 'Suspender Taller'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/checkout?shop_id=${shop.id}`;
                            navigator.clipboard.writeText(link);
                            setCopiedShopId(shop.id);
                            setTimeout(() => setCopiedShopId(null), 2000);
                          }}
                          className="bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface p-1.5 rounded-lg transition-colors inline-flex items-center"
                          title="Copiar Enlace de Cobro Checkout"
                        >
                          {copiedShopId === shop.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-primary" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setDeleteError('');
                            setDeleteConfirmText('');
                            setShopToDelete(shop);
                          }}
                          className="bg-error/15 border border-error/30 hover:bg-error/25 text-error p-1.5 rounded-lg transition-colors inline-flex items-center"
                          title="Eliminar Taller / Negocio definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE ALTA MANUAL DE TALLER DIRECTAMENTE A SUPABASE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleManualAddShop}
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Alta Manual de Taller en Supabase
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Nombre del Taller / Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="Ej: Electrónica Central"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Email del Dueño *
                </label>
                <input
                  type="email"
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="dueno@taller.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={modalLoading}
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalLoading ? 'Guardando en Supabase...' : 'Guardar en Supabase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE TALLER (HARD DELETE) */}
      {shopToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container border border-error/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-error flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-error shrink-0" /> Eliminar Taller Permanentemente
              </h3>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setShopToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {/* Error si ocurre */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Detalles del Taller */}
            <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/70 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Taller / Negocio:</span>
                <strong className="text-on-surface">{shopToDelete.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Email del Dueño:</span>
                <span className="font-mono text-on-surface">{shopToDelete.owner_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Órdenes Generadas:</span>
                <span className="font-mono text-primary font-bold">{shopToDelete.orders_count || 0} órdenes</span>
              </div>
            </div>

            {/* Alerta de Peligro */}
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> ¡Advertencia de Acción Irreversible!
              </div>
              <p className="text-[11px] text-error/90 leading-relaxed">
                Esta acción eliminará <strong>permanentemente</strong> el taller y todos sus datos en cascada: órdenes de servicio, clientes, dispositivos, inventario, trabajos extra y accesos de usuarios asociados en Supabase.
              </p>
            </div>

            {/* Confirmación por Texto */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-on-surface-variant font-medium">
                Para confirmar, escribe exactamente <strong className="text-on-surface font-mono">{shopToDelete.name}</strong> o la palabra <strong className="text-error font-mono">ELIMINAR</strong>:
              </label>
              <input
                type="text"
                disabled={deleteLoading}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Escribe "${shopToDelete.name}" o "ELIMINAR"`}
                className="w-full bg-surface-container-lowest border border-error/50 focus:border-error rounded-xl p-2.5 text-xs text-on-surface font-mono focus:outline-none focus:ring-1 focus:ring-error"
                autoFocus
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-outline-variant/40">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setShopToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  deleteLoading ||
                  (deleteConfirmText.trim().toLowerCase() !== shopToDelete.name.trim().toLowerCase() &&
                    deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR')
                }
                onClick={handleDeleteShop}
                className="bg-error text-on-error font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow hover:bg-error/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando taller...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
