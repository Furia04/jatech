'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  EyeOff,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Calendar,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, ServiceOrder, OrderStatus, Shop } from '@/types';
import { hasFinancialAccess } from '@/lib/permissions';
import { fetchServiceOrders, getCurrentUserProfile, updateServiceOrderStatus, fetchCurrentShop } from '@/lib/supabase/services';
import { WhatsAppModal, WhatsAppTemplateKey } from '@/components/orders/whatsapp-modal';

export default function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappModalOrder, setWhatsappModalOrder] = useState<ServiceOrder | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState<WhatsAppTemplateKey>('recordatorio');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [profile, realOrders, realShop] = await Promise.all([
          getCurrentUserProfile(),
          fetchServiceOrders(),
          fetchCurrentShop(),
        ]);
        setUserProfile(profile);
        setOrders(realOrders || []);
        setShop(realShop);
      } catch (err) {
        console.error('Error al cargar datos del panel:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const canSeeMoney = userProfile ? hasFinancialAccess(userProfile) : true;

  // CÁLCULOS EN TIEMPO REAL DESDE LA BASE DE DATOS DEL TENANT
  const totalOrders = orders.length;

  const pendingOrders = orders.filter((o) =>
    ['recibido', 'en_revision', 'esperando_repuesto', 'esperando_cliente'].includes(o.status)
  ).length;

  const readyOrders = orders.filter((o) => o.status === 'para_entregar').length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.final_price || 0), 0);

  // ALERTA DE ÓRDENES CON MÁS DE 30 DÍAS DE INGRESO (EN RIESGO / VENCIDAS)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overdueOrders = orders.filter((o) => {
    const createdAt = new Date(o.created_at);
    const isOld = createdAt < thirtyDaysAgo;
    const isNotDelivered = o.status !== 'abandonado';
    return isOld && isNotDelivered;
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleMarkAsAbandoned = async (orderId: string) => {
    try {
      await updateServiceOrderStatus(orderId, 'abandonado');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'abandonado' as OrderStatus } : o))
      );
    } catch (err) {
      console.warn('Actualizado estado de orden a abandonado');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant uppercase">Recibido</span>;
      case 'en_revision':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-container/20 text-primary border border-primary/30 uppercase">En Revisión</span>;
      case 'esperando_repuesto':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary-container/20 text-tertiary border border-tertiary-container/30 uppercase">Esperando Repuesto</span>;
      case 'esperando_cliente':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-900/30 text-purple-300 border border-purple-500/30 uppercase">Esperando Resp. Cliente</span>;
      case 'para_entregar':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Para Entregar</span>;
      case 'abandonado':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-error/20 text-error border border-error/30 uppercase">Abandonado</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex justify-between items-end border-b border-outline-variant/60 pb-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">
            Panel Principal del Taller
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumen técnico y operativo del taller en tiempo real.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-body-sm text-xs">Cargando métricas del taller...</p>
        </div>
      ) : (
        <>
          {/* TARJETAS BENTO DE RESUMEN REAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  TOTAL DE ÓRDENES
                </span>
                <span className="bg-primary/10 text-primary p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                </span>
              </div>
              <div className="font-display-lg text-3xl font-bold text-on-surface">
                {totalOrders}
              </div>
              <div className="font-mono-data text-xs text-on-surface-variant mt-1">
                Registradas en la base de datos
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  PENDIENTES
                </span>
                <span className="bg-tertiary-container/20 text-tertiary p-2 rounded-lg">
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <div className="font-display-lg text-3xl font-bold text-on-surface">
                {pendingOrders}
              </div>
              <div className="font-mono-data text-xs text-on-surface-variant mt-1">
                En revisión o esperando insumos
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  PARA ENTREGAR
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <div className="font-display-lg text-3xl font-bold text-emerald-400">
                {readyOrders}
              </div>
              <div className="font-mono-data text-xs text-on-surface-variant mt-1">
                Listas para devolución al cliente
              </div>
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                  RECAUDACIÓN ACUMULADA
                </span>
                <span className="bg-primary/10 text-primary p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </span>
              </div>
              {canSeeMoney ? (
                <>
                  <div className="font-display-lg text-3xl font-bold text-on-surface font-mono-data">
                    ${totalRevenue.toFixed(2)}
                  </div>
                  <div className="font-mono-data text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Total presupuestado
                  </div>
                </>
              ) : (
                <>
                  <div className="font-display-lg text-2xl text-on-surface-variant/40 flex items-center gap-2">
                    <EyeOff className="w-5 h-5" /> ****
                  </div>
                  <div className="font-mono-data text-xs text-on-surface-variant/60 italic mt-1">
                    Restringido para técnicos
                  </div>
                </>
              )}
            </div>
          </div>

          {/* BANNER DE ALERTA DE ÓRDENES VENCIDAS (+30 DÍAS) */}
          {overdueOrders.length > 0 && (
            <div className="bg-error/10 border-2 border-error/40 rounded-xl p-5 space-y-4 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-error/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-error/20 text-error flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-title-sm text-base font-bold text-error flex items-center gap-2">
                      ¡Alerta! {overdueOrders.length} Órdenes superaron los 30 días de antigüedad
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                      Equipos ingresados hace más de un mes que aún no han sido entregados o reclamados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {overdueOrders.map((ord) => {
                  const daysAgo = Math.floor(
                    (new Date().getTime() - new Date(ord.created_at).getTime()) / (1000 * 3600 * 24)
                  );

                  return (
                    <div
                      key={ord.id}
                      className="bg-surface-container-lowest border border-error/30 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono-data font-bold text-error">
                          {ord.tracking_code}
                        </span>
                        <span className="font-semibold text-on-surface">
                          {ord.customer_name}
                        </span>
                        <span className="text-on-surface-variant">
                          ({ord.device_info})
                        </span>
                        <span className="bg-error/20 text-error font-bold px-2 py-0.5 rounded font-mono text-[10px]">
                          hace {daysAgo} días
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setWhatsappTemplate('recordatorio');
                            setWhatsappModalOrder(ord);
                          }}
                          className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 px-3 py-1 rounded font-bold transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Reclamar vía WA
                        </button>

                        <button
                          onClick={() => handleMarkAsAbandoned(ord.id)}
                          className="bg-error/20 text-error hover:bg-error/30 border border-error/30 px-3 py-1 rounded font-bold transition-colors text-[11px] cursor-pointer"
                        >
                          Marcar Abandonado
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABLA DE ÓRDENES RECIENTES REAL */}
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                Últimas Órdenes Ingresadas
              </h3>
              <Link
                href="/orders"
                className="font-label-caps text-label-caps text-primary hover:text-primary-container transition-colors flex items-center gap-1 font-semibold text-xs"
              >
                Ver Todas las Órdenes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary" />
                <p className="text-xs text-on-surface-variant italic">
                  No hay órdenes registradas aún en la base de datos de este taller.
                </p>
                <Link
                  href="/orders/new"
                  className="bg-primary text-on-primary font-title-sm text-xs font-bold px-4 py-2 rounded-lg"
                >
                  + Registrar Primera Orden
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-highest border-b border-outline-variant font-label-caps text-label-caps text-on-surface-variant">
                      <th className="px-table-cell-padding-h py-table-cell-padding-v font-semibold">
                        Código OT
                      </th>
                      <th className="px-table-cell-padding-h py-table-cell-padding-v font-semibold">
                        Cliente (DNI)
                      </th>
                      <th className="px-table-cell-padding-h py-table-cell-padding-v font-semibold">
                        Dispositivo / Equipo
                      </th>
                      <th className="px-table-cell-padding-h py-table-cell-padding-v font-semibold">
                        Estado
                      </th>
                      <th className="px-table-cell-padding-h py-table-cell-padding-v font-semibold text-right">
                        Monto Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-data text-mono-data divide-y divide-outline-variant/50">
                    {recentOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className="hover:bg-surface-container-high transition-colors group cursor-pointer"
                      >
                        <td className="px-table-cell-padding-h py-table-cell-padding-v text-primary font-bold">
                          {ord.tracking_code}
                        </td>
                        <td className="px-table-cell-padding-h py-table-cell-padding-v text-on-surface">
                          <div>
                            <span className="font-bold">{ord.customer_name}</span>
                            {ord.customer_document_id && (
                              <span className="text-[10px] text-on-surface-variant block">
                                DNI: {ord.customer_document_id}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-table-cell-padding-h py-table-cell-padding-v text-on-surface-variant">
                          {ord.device_info}
                        </td>
                        <td className="px-table-cell-padding-h py-table-cell-padding-v">
                          {getStatusBadge(ord.status)}
                        </td>
                        <td className="px-table-cell-padding-h py-table-cell-padding-v text-right text-on-surface font-bold">
                          {canSeeMoney ? (
                            `$${ord.final_price?.toFixed(2)}`
                          ) : (
                            <span className="text-on-surface-variant/40 italic">
                              --
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* CENTRO DE NOTIFICACIONES WHATSAPP */}
      {whatsappModalOrder && (
        <WhatsAppModal
          order={whatsappModalOrder}
          shop={shop}
          defaultTemplate={whatsappTemplate}
          onClose={() => setWhatsappModalOrder(null)}
        />
      )}
    </div>
  );
}
