'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Calendar,
  Edit,
  Receipt,
  ExternalLink,
  ArrowUpDown,
  MessageSquare,
  X,
  Save,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Copy,
  Check,
  Printer,
  DollarSign,
  Calculator,
  Loader2,
  FolderOpen,
  Send,
  ShieldCheck,
  PackageCheck,
  Camera,
} from 'lucide-react';
import { PatternLockInput } from '@/components/orders/pattern-lock-input';
import { InventoryItem, OrderStatus, ServiceOrder, Shop, UserProfile } from '@/types';
import { BudgetCalculator } from '@/components/orders/budget-calculator';
import { ThermalTicket } from '@/components/orders/thermal-ticket';
import { DeliveryTicket } from '@/components/orders/delivery-ticket';
import { PhotoUploader } from '@/components/orders/photo-uploader';
import { WhatsAppModal, WhatsAppTemplateKey } from '@/components/orders/whatsapp-modal';
import { fetchServiceOrders, updateServiceOrderStatus, fetchInventory, fetchCurrentShop } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estado para las Ventanas Emergentes
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<ServiceOrder | null>(null);
  const [deliveryTicketOrder, setDeliveryTicketOrder] = useState<ServiceOrder | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'budget' | 'photos'>('details');
  const [copiedLink, setCopiedLink] = useState(false);

  // Estado para Centro de Notificaciones WhatsApp
  const [whatsappModalOrder, setWhatsappModalOrder] = useState<ServiceOrder | null>(null);
  const [whatsappDefaultTemplate, setWhatsappDefaultTemplate] = useState<WhatsAppTemplateKey>('listo');

  // Cargar órdenes e inventario reales de la base de datos Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [realOrders, realInventory, currentShop] = await Promise.all([
          fetchServiceOrders(),
          fetchInventory(),
          fetchCurrentShop(),
        ]);
        setOrders(realOrders || []);
        setInventory(realInventory || []);
        setShop(currentShop);
      } catch (err) {
        console.error('Error al cargar órdenes de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOrders = orders.filter((ord) => {
    const matchesFilter =
      activeFilter === 'all' || ord.status === activeFilter;
    const matchesSearch =
      ord.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_document_id?.includes(searchQuery) ||
      ord.device_info?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const handleSaveModal = async () => {
    if (!editingOrder) return;

    const previousOrder = orders.find(o => o.id === editingOrder.id);
    const statusChangedToReady = previousOrder?.status !== 'para_entregar' && editingOrder.status === 'para_entregar';

    let calculatedWarrantyUntil = editingOrder.warranty_until;
    let calculatedDeliveredAt = editingOrder.delivered_at;

    // Solo se establece fecha de entrega si realmente se entrega el equipo
    if (editingOrder.status === 'entregado' && !calculatedDeliveredAt) {
      calculatedDeliveredAt = new Date().toISOString();
    }

    const isDeliveredOrReady = editingOrder.status === 'para_entregar' || editingOrder.status === 'entregado';
    const effectiveWarrantyPeriod = editingOrder.warranty_period || (isDeliveredOrReady ? '30 días' : undefined);

    if (effectiveWarrantyPeriod && effectiveWarrantyPeriod !== 'Sin garantía') {
      const daysMap: Record<string, number> = {
        '30 días': 30,
        '60 días': 60,
        '90 días': 90,
        '6 meses': 180,
        '12 meses': 365,
      };
      const daysToAdd = daysMap[effectiveWarrantyPeriod] || 30;
      const d = new Date();
      d.setDate(d.getDate() + daysToAdd);
      calculatedWarrantyUntil = d.toISOString();
    }

    try {
      await updateServiceOrderStatus(
        editingOrder.id,
        editingOrder.status,
        editingOrder.technical_diagnosis,
        editingOrder.final_price,
        effectiveWarrantyPeriod,
        calculatedWarrantyUntil,
        calculatedDeliveredAt,
        editingOrder.tracking_code,
        editingOrder.advance_payment,
        editingOrder.payment_method,
        editingOrder.device_photos
      );

      const updatedOrder: ServiceOrder = {
        ...editingOrder,
        warranty_period: effectiveWarrantyPeriod,
        warranty_until: calculatedWarrantyUntil,
        delivered_at: calculatedDeliveredAt,
      };

      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? updatedOrder : o))
      );

      // Si el filtro activo era otro estado y no 'all', mover la vista al nuevo estado para no perder la orden de vista
      if (activeFilter !== 'all' && activeFilter !== editingOrder.status) {
        setActiveFilter(editingOrder.status);
      }

      setEditingOrder(null);

      // Si cambió el estado a "Para Entregar", sugerir enviar notificación por WhatsApp
      if (statusChangedToReady) {
        setWhatsappDefaultTemplate('listo');
        setWhatsappModalOrder(updatedOrder);
      }
    } catch (err: any) {
      console.error('Error al guardar la orden de servicio en Supabase:', err);
      alert(`Error al guardar los cambios: ${err?.message || 'Revisa la conexión con Supabase'}`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] uppercase font-bold tracking-wide">
            Recibido
          </span>
        );
      case 'en_revision':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary border border-primary/30 text-[10px] uppercase font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
            En Revisión
          </span>
        );
      case 'esperando_repuesto':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-fixed border border-tertiary-fixed/20 text-[10px] uppercase font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed mr-1.5" />
            Esperando Repuesto
          </span>
        );
      case 'esperando_cliente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-500/30 text-[10px] uppercase font-bold tracking-wide">
            Esperando Resp. Cliente
          </span>
        );
      case 'para_entregar':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Para Entregar
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold tracking-wide">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            Entregado
          </span>
        );
      case 'abandonado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-error-container/30 text-error border border-error/30 text-[10px] uppercase font-bold tracking-wide">
            Orden Vencida
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Título y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface">
            Órdenes de Servicio
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
            Gestiona la atención técnica, diagnósticos, presupuestos y emisión de comandas de 80mm.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl font-title-sm text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Ingreso
        </Link>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código OT (#WO-xxxx), cliente, DNI o equipo..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 pl-10 pr-4 font-body-sm text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center justify-center gap-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest px-3 py-2 rounded-xl text-xs font-title-sm text-on-surface font-semibold transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
            {sortOrder === 'asc' ? 'Más Antiguas Primero' : 'Más Recientes Primero'}
          </button>
        </div>

        {/* Filtros por Estado */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'recibido', label: 'Recibidas' },
            { id: 'en_revision', label: 'En Revisión' },
            { id: 'esperando_repuesto', label: 'Esperando Repuesto' },
            { id: 'esperando_cliente', label: 'Esperando Cliente' },
            { id: 'para_entregar', label: 'Para Entregar' },
            { id: 'entregado', label: 'Entregadas' },
            { id: 'abandonado', label: 'Vencidas (+30 días)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-title-sm text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-surface-container border border-outline-variant/80 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs">Cargando órdenes de la base de datos...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-on-surface-variant mx-auto opacity-50" />
            <h3 className="font-title-sm text-base font-bold text-on-surface">No hay órdenes registradas</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no has registrado órdenes de ingreso en tu taller.'}
            </p>
            {!searchQuery && (
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-xl text-xs font-bold shadow transition-all mt-2"
              >
                <Plus className="w-4 h-4" /> Crear Primera Orden
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-surface-container-highest border-b border-outline-variant font-label-caps text-on-surface-variant uppercase">
                <tr>
                  <th className="p-4">Código OT</th>
                  <th className="p-4">Cliente / DNI</th>
                  <th className="p-4">Equipo / Dispositivo</th>
                  <th className="p-4">Falla Reportada</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Precio Final</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-mono-data">
                {sortedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-4 font-bold text-primary font-mono text-sm">
                      {ord.tracking_code}
                    </td>
                    <td className="p-4 font-sans">
                      <div className="font-bold text-on-surface">{ord.customer_name}</div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        DNI: {ord.customer_document_id || 'S/D'} • {ord.customer_phone || 'Sin tel'}
                      </div>
                    </td>
                    <td className="p-4 font-sans font-semibold text-on-surface">
                      <div>{ord.device_info}</div>
                      {ord.device_photos && ord.device_photos.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-bold mt-0.5">
                          <Camera className="w-3 h-3" /> {ord.device_photos.length} fotos
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-on-surface-variant max-w-xs truncate">
                      {ord.reported_fault}
                    </td>
                    <td className="p-4">{getStatusBadge(ord.status)}</td>
                    <td className="p-4 text-right font-bold text-on-surface text-sm">
                      <div>${(ord.final_price || 0).toLocaleString('es-AR')}</div>
                      {(ord.advance_payment || 0) > 0 && (
                        <div className="text-[10px] font-mono">
                          {(ord.final_price || 0) <= (ord.advance_payment || 0) ? (
                            <span className="text-emerald-400 font-bold">✓ Saldado</span>
                          ) : (
                            <span className="text-amber-400 font-bold">
                              Resta: ${((ord.final_price || 0) - (ord.advance_payment || 0)).toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center space-x-1.5">
                      {/* Botón Editar / Diagnóstico */}
                      <button
                        onClick={() => {
                          setEditingOrder(ord);
                          setActiveModalTab('details');
                        }}
                        className="p-1.5 bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors inline-flex items-center"
                        title="Editar / Diagnóstico"
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                      </button>

                      {/* Botón Imprimir Ticket / Comanda: Comanda de Entrega (solo si es entregado) vs Comanda de Ingreso */}
                      {ord.status === 'entregado' ? (
                        <button
                          onClick={() => setDeliveryTicketOrder(ord)}
                          className="p-1.5 bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Comanda & Certificado de Entrega (Imprimir / WhatsApp)"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-400" /> Ticket Entrega
                        </button>
                      ) : (
                        <button
                          onClick={() => setPrintingOrder(ord)}
                          className="p-1.5 bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors inline-flex items-center"
                          title="Imprimir Comanda de Ingreso (80mm)"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                      )}

                      {/* Botón WhatsApp Notificar */}
                      {ord.customer_phone && (
                        <button
                          onClick={() => {
                            const suggestedTemplate: WhatsAppTemplateKey =
                              ord.status === 'para_entregar'
                                ? 'listo'
                                : ord.status === 'en_revision' || ord.status === 'esperando_repuesto'
                                ? 'presupuesto'
                                : ord.status === 'abandonado'
                                ? 'recordatorio'
                                : 'ingreso';
                            setWhatsappDefaultTemplate(suggestedTemplate);
                            setWhatsappModalOrder(ord);
                          }}
                          className="p-1.5 bg-emerald-900/30 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                          title="Enviar Notificación WhatsApp con Plantillas"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN / DIAGNÓSTICO Y PRESUPUESTO */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <div>
                <span className="font-label-caps text-[10px] text-primary uppercase font-bold">
                  GESTIÓN DE SERVICIO TÉCNICO
                </span>
                <h3 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2">
                  Orden <span className="font-mono text-primary">{editingOrder.tracking_code}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {editingOrder.customer_phone && (
                  <button
                    onClick={() => {
                      const suggestedTemplate: WhatsAppTemplateKey =
                        editingOrder.status === 'para_entregar'
                          ? 'listo'
                          : editingOrder.status === 'en_revision' || editingOrder.status === 'esperando_repuesto'
                          ? 'presupuesto'
                          : editingOrder.status === 'abandonado'
                          ? 'recordatorio'
                          : 'ingreso';
                      setWhatsappDefaultTemplate(suggestedTemplate);
                      setWhatsappModalOrder(editingOrder);
                    }}
                    className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Enviar Notificación WhatsApp al Cliente"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Notificar WA
                  </button>
                )}
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Pestañas del Modal */}
            <div className="flex border-b border-outline-variant gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`pb-2.5 px-4 text-xs font-title-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeModalTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Diagnóstico & Estado
              </button>
              <button
                onClick={() => setActiveModalTab('budget')}
                className={`pb-2.5 px-4 text-xs font-title-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'budget'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" /> Calculadora de Repuestos
              </button>
              <button
                onClick={() => setActiveModalTab('photos')}
                className={`pb-2.5 px-4 text-xs font-title-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'photos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Evidencias Fotográficas ({editingOrder.device_photos?.length || 0})
              </button>
            </div>

            {activeModalTab === 'details' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Estado de la Orden
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        status: e.target.value as OrderStatus,
                      })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-bold"
                  >
                    <option value="recibido">Recibido en Taller</option>
                    <option value="en_revision">En Revisión / Diagnóstico</option>
                    <option value="esperando_repuesto">Esperando Repuesto</option>
                    <option value="esperando_cliente">Esperando Respuesta Cliente</option>
                    <option value="para_entregar">¡Listo para Entregar!</option>
                    <option value="entregado">Entregado al Cliente</option>
                    <option value="abandonado">Orden Vencida (+30 Días)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Informe Técnico / Diagnóstico
                  </label>
                  <textarea
                    rows={3}
                    value={editingOrder.technical_diagnosis || ''}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        technical_diagnosis: e.target.value,
                      })
                    }
                    placeholder="Escribe aquí el informe técnico visible para el cliente en la página de seguimiento..."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface"
                  />
                </div>

                {/* GESTIÓN FINANCIERA: PRECIO, SEÑA Y SALDO */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
                    <span className="font-bold uppercase text-[11px] text-on-surface flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Resumen Financiero & Seña
                    </span>
                    {(editingOrder.final_price || 0) > (editingOrder.advance_payment || 0) && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingOrder({
                            ...editingOrder,
                            advance_payment: editingOrder.final_price || 0,
                          })
                        }
                        className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition-colors"
                      >
                        ✓ Marcar como 100% Saldado
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-on-surface-variant text-[10px] uppercase mb-1">
                        Precio Total ($ ARS)
                      </label>
                      <input
                        type="number"
                        value={editingOrder.final_price ?? ''}
                        onChange={(e) =>
                          setEditingOrder({
                            ...editingOrder,
                            final_price: Number(e.target.value),
                          })
                        }
                        placeholder="0.00"
                        className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-2 text-xs text-on-surface font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-emerald-400 text-[10px] uppercase mb-1">
                        Seña / Anticipo ($)
                      </label>
                      <input
                        type="number"
                        value={editingOrder.advance_payment ?? ''}
                        onChange={(e) =>
                          setEditingOrder({
                            ...editingOrder,
                            advance_payment: Number(e.target.value),
                          })
                        }
                        placeholder="0.00"
                        className="w-full bg-surface-container-high border border-emerald-500/40 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-on-surface-variant text-[10px] uppercase mb-1">
                        Medio de Pago
                      </label>
                      <select
                        value={editingOrder.payment_method || 'efectivo'}
                        onChange={(e) =>
                          setEditingOrder({
                            ...editingOrder,
                            payment_method: e.target.value,
                          })
                        }
                        className="w-full bg-surface-container-high border border-outline-variant rounded-lg p-2 text-xs text-on-surface font-bold"
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">🏦 Transferencia</option>
                        <option value="mercadopago">📱 Mercado Pago</option>
                        <option value="debito">💳 Débito</option>
                        <option value="credito">💳 Crédito</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60 font-mono text-xs">
                    <span className="text-on-surface-variant">Saldo Restante a Cobrar:</span>
                    <span className={`font-extrabold text-sm ${
                      (editingOrder.final_price || 0) <= (editingOrder.advance_payment || 0)
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      ${Math.max(0, (editingOrder.final_price || 0) - (editingOrder.advance_payment || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* OTORGAR GARANTÍA DE SERVICIO (AL ENTREGAR) */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Garantía de Servicio (Al Entregar)
                    </label>
                    <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded">
                      {editingOrder.warranty_period || '30 días (Estándar)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['30 días', '60 días', '90 días', '6 meses', '12 meses', 'Sin garantía'].map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() =>
                          setEditingOrder({
                            ...editingOrder,
                            warranty_period: period,
                          })
                        }
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                          (editingOrder.warranty_period || '30 días') === period
                            ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow'
                            : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic">
                    La garantía otorgada se imprimirá en el ticket de entrega y aparecerá en la página de seguimiento del cliente.
                  </p>
                </div>

                {/* PATRÓN DE DESBLOQUEO TÁCTIL (SOLO VISIBLE EN LA ORDEN DIGITAL) */}
                {((editingOrder as any).custom_attributes?.unlock_pattern?.length > 0 || (editingOrder as any).unlock_pattern?.length > 0) && (
                  <div className="pt-2 border-t border-outline-variant/60">
                    <PatternLockInput
                      value={(editingOrder as any).custom_attributes?.unlock_pattern || (editingOrder as any).unlock_pattern}
                      readOnly
                    />
                  </div>
                )}
              </div>
            ) : activeModalTab === 'photos' ? (
              <div className="space-y-4">
                <div className="border-b border-outline-variant/60 pb-2">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" /> Evidencias Visuales del Equipo
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Fotos tomadas al ingresar o durante el proceso de reparación técnica.
                  </p>
                </div>
                <PhotoUploader
                  photos={editingOrder.device_photos || []}
                  onChange={(newPhotos) =>
                    setEditingOrder({
                      ...editingOrder,
                      device_photos: newPhotos,
                    })
                  }
                  maxPhotos={8}
                />
              </div>
            ) : (
              <BudgetCalculator
                order={editingOrder}
                inventory={inventory}
                onApplyBudget={(cost, price) => {
                  setEditingOrder({
                    ...editingOrder,
                    final_price: price,
                  });
                  setActiveModalTab('details');
                }}
              />
            )}

            <div className="flex justify-between items-center pt-2 border-t border-outline-variant/60">
              {editingOrder.status === 'entregado' ? (
                <button
                  onClick={() => {
                    setDeliveryTicketOrder(editingOrder);
                    setEditingOrder(null);
                  }}
                  className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4 text-emerald-400" /> Ticket & Comanda de Entrega
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPrintingOrder(editingOrder);
                    setEditingOrder(null);
                  }}
                  className="px-3.5 py-2 bg-surface-bright border border-outline-variant text-on-surface hover:bg-surface-container-highest rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-purple-400" /> Imprimir Comanda 80mm
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveModal}
                  className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPRESIÓN DE COMANDA TÉRMICA 80MM */}
      {printingOrder && (
        <ThermalTicket
          order={printingOrder}
          shop={shop}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* COMANDA & CERTIFICADO DE ENTREGA (SOLO PARA ESTADO ENTREGADO) */}
      {deliveryTicketOrder && (
        <DeliveryTicket
          order={deliveryTicketOrder}
          shop={shop}
          onClose={() => setDeliveryTicketOrder(null)}
        />
      )}

      {/* CENTRO DE NOTIFICACIONES WHATSAPP CON PLANTILLAS DINÁMICAS */}
      {whatsappModalOrder && (
        <WhatsAppModal
          order={whatsappModalOrder}
          shop={shop}
          defaultTemplate={whatsappDefaultTemplate}
          onClose={() => setWhatsappModalOrder(null)}
        />
      )}
    </div>
  );
}
