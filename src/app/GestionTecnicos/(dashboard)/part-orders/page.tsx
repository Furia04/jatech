'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  DollarSign,
  User,
  Phone,
  Smartphone,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  AlertCircle,
  Check,
  ChevronDown,
  UserPlus,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { PartOrder, PartOrderStatus, Shop, UserProfile, Customer, Device } from '@/types';
import { hasFinancialAccess } from '@/lib/permissions';
import {
  fetchPartOrders,
  createPartOrder,
  updatePartOrder,
  deletePartOrder,
  fetchCustomers,
  createCustomer,
  fetchCustomerDevicesAndOrders,
  fetchCurrentShop,
  getCurrentUserProfile,
} from '@/lib/supabase/services';
import { PartOrderWhatsAppModal } from '@/components/part-orders/part-order-whatsapp-modal';

export default function PartOrdersPage() {
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Clientes y Dispositivos para selección
  const [clientMode, setClientMode] = useState<'new' | 'existing'>('new');
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDevices, setCustomerDevices] = useState<Device[]>([]);
  const [loadingCustomerDevices, setLoadingCustomerDevices] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal WhatsApp
  const [whatsAppOrder, setWhatsAppOrder] = useState<PartOrder | null>(null);

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    part_name: '',
    device_model: '',
    advance_payment: 0,
    expected_price: 0,
    status: 'pending' as PartOrderStatus,
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal Confirmar Eliminación
  const [deletingOrder, setDeletingOrder] = useState<PartOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Carga inicial
  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, shopData, ordersData, customersData] = await Promise.all([
        getCurrentUserProfile(),
        fetchCurrentShop(),
        fetchPartOrders(),
        fetchCustomers(),
      ]);
      setUserProfile(profileData);
      setShop(shopData);
      setOrders(ordersData);
      setExistingCustomers(customersData || []);
    } catch (err) {
      console.error('Error al cargar pedidos de repuestos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const canSeeMoney = userProfile ? hasFinancialAccess(userProfile) : true;

  // Filtrado de clientes predictivo
  const filteredCustomers = existingCustomers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.document_id && c.document_id.toLowerCase().includes(q))
    );
  });

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setFormData((prev) => ({
      ...prev,
      customer_name: cust.full_name,
      customer_phone: cust.phone || '',
    }));
    setCustomerSearchQuery('');

    // Cargar dispositivos del cliente
    try {
      setLoadingCustomerDevices(true);
      const { devices } = await fetchCustomerDevicesAndOrders(cust.id);
      setCustomerDevices(devices || []);
      if (devices && devices.length === 1) {
        const devLabel = `${devices[0].brand} ${devices[0].model}`.trim() || devices[0].type || '';
        setFormData((prev) => ({ ...prev, device_model: devLabel }));
      }
    } catch (err) {
      console.warn('Error al cargar equipos de cliente:', err);
    } finally {
      setLoadingCustomerDevices(false);
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerDevices([]);
    setFormData((prev) => ({
      ...prev,
      customer_name: '',
      customer_phone: '',
      device_model: '',
    }));
  };

  const handleSelectDevice = (dev: Device) => {
    const label = `${dev.brand} ${dev.model}`.trim() || dev.type || '';
    setFormData((prev) => ({ ...prev, device_model: label }));
  };

  // Métricas
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const arrivedOrders = orders.filter((o) => o.status === 'arrived').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  const totalAdvance = orders.reduce((acc, o) => acc + (o.advance_payment || 0), 0);
  const totalExpected = orders.reduce((acc, o) => acc + (o.expected_price || 0), 0);
  const pendingBalanceTotal = Math.max(0, totalExpected - totalAdvance);

  // Filtrado
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.toLowerCase().includes(q) ||
      order.part_name.toLowerCase().includes(q) ||
      (order.device_model && order.device_model.toLowerCase().includes(q)) ||
      (order.notes && order.notes.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setEditingOrderId(null);
    setClientMode('new');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerDevices([]);
    setFormData({
      customer_name: '',
      customer_phone: '',
      part_name: '',
      device_model: '',
      advance_payment: 0,
      expected_price: 0,
      status: 'pending',
      notes: '',
    });
    setModalError('');
    setShowModal(true);
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (order: PartOrder) => {
    setEditingOrderId(order.id);
    setClientMode('new');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerDevices([]);
    setFormData({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      part_name: order.part_name,
      device_model: order.device_model || '',
      advance_payment: order.advance_payment || 0,
      expected_price: order.expected_price || 0,
      status: order.status,
      notes: order.notes || '',
    });
    setModalError('');
    setShowModal(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.customer_phone.trim() || !formData.part_name.trim()) {
      setModalError('Nombre del cliente, teléfono y nombre del repuesto son obligatorios.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (editingOrderId) {
        // Update
        const success = await updatePartOrder(editingOrderId, formData);
        if (!success) throw new Error('No se pudo actualizar el encargo.');

        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrderId ? { ...o, ...formData } : o))
        );
      } else {
        // Si es cliente nuevo y no existía, guardarlo en la base de clientes del taller
        if (clientMode === 'new' && !selectedCustomer) {
          try {
            const newCust = await createCustomer({
              full_name: formData.customer_name.trim(),
              phone: formData.customer_phone.trim(),
            });
            if (newCust) {
              setExistingCustomers((prev) => [newCust, ...prev]);
            }
          } catch (custErr) {
            console.warn('No se pudo registrar en customers:', custErr);
          }
        }

        // Create
        const newOrder = await createPartOrder({
          shop_id: shop?.id || '',
          ...formData,
        });
        if (!newOrder) throw new Error('No se pudo registrar el encargo.');

        setOrders((prev) => [newOrder, ...prev]);
      }

      setShowModal(false);
    } catch (err: any) {
      console.error('Error al guardar pedido de repuesto:', err);
      setModalError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setModalLoading(false);
    }
  };

  // Cambio Rápido de Estado
  const handleQuickStatusChange = async (order: PartOrder, newStatus: PartOrderStatus) => {
    try {
      const success = await updatePartOrder(order.id, { status: newStatus });
      if (success) {
        const updated = { ...order, status: newStatus };
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));

        // Si se marca que llegó, sugerir abrir el modal de WhatsApp
        if (newStatus === 'arrived') {
          setWhatsAppOrder(updated);
        }
      }
    } catch (err) {
      console.error('Error al actualizar estado rápido:', err);
    }
  };

  // Eliminar Pedido
  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    setDeleteLoading(true);
    try {
      const success = await deletePartOrder(deletingOrder.id);
      if (success) {
        setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        setDeletingOrder(null);
      } else {
        alert('No se pudo eliminar el pedido.');
      }
    } catch (err) {
      console.error('Error al eliminar pedido:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: PartOrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pendiente / En camino
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ¡Llegó al Taller!
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3.5 h-3.5" />
            Entregado / Colocado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-title-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Pedidos de Repuestos
              </h1>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                Control de piezas encargadas para clientes, señas y avisos de llegada por WhatsApp
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Encargar Repuesto</span>
        </button>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-label-caps uppercase">Total Encargos</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">{totalOrders}</p>
          <span className="text-[11px] text-on-surface-variant">Registrados en taller</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-label-caps uppercase">Pendientes</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400">{pendingOrders}</p>
          <span className="text-[11px] text-amber-400/80">En camino / Pedidos</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-emerald-500/30 bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-label-caps uppercase">Llegaron al Taller</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{arrivedOrders}</p>
          <span className="text-[11px] text-emerald-400/80">Listos para notificar / colocar</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-label-caps uppercase">Entregados</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">{deliveredOrders}</p>
          <span className="text-[11px] text-on-surface-variant">Retirados por cliente</span>
        </div>

        {canSeeMoney && (
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-xl bg-surface-container border border-outline-variant">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-label-caps uppercase">Señas Cobradas</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-400">
              ${totalAdvance.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-slate-400">
              Resta cobrar: ${pendingBalanceTotal.toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </div>

      {/* 3. Barra de Búsqueda y Filtros de Estado */}
      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Búsqueda */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, repuesto, modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'arrived', label: '¡Llegaron!' },
            { id: 'delivered', label: 'Entregados' },
            { id: 'cancelled', label: 'Cancelados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Lista de Pedidos */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-surface-container border border-outline-variant flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-body-md text-xs text-on-surface-variant">
            Cargando pedidos de repuestos desde el servidor...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface-container border border-outline-variant flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-title-md font-bold text-on-surface mb-1">
            No se encontraron pedidos de repuestos
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-md mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'No hay encargos que coincidan con los filtros aplicados.'
              : 'Todavía no registraste repuestos encargados para clientes en tu taller.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Encargar primer repuesto</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const advance = order.advance_payment || 0;
            const expected = order.expected_price || 0;
            const remaining = Math.max(0, expected - advance);
            const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={order.id}
                className={`p-4 sm:p-5 rounded-2xl bg-surface-container border transition-all hover:border-outline ${
                  order.status === 'arrived'
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-outline-variant'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {renderStatusBadge(order.status)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                        <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{order.part_name}</span>
                      </h3>
                      {order.device_model && (
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-mono">
                          <Smartphone className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span>Modelo: {order.device_model}</span>
                        </p>
                      )}
                    </div>

                    {/* Cliente y Teléfono */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        {order.customer_name}
                      </span>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-emerald-400 hover:underline"
                        title="Abrir chat de WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {order.customer_phone}
                      </a>
                    </div>

                    {order.notes && (
                      <p className="text-xs text-slate-400 bg-surface-container-highest/50 p-2.5 rounded-xl border border-outline-variant/50 max-w-2xl leading-relaxed">
                        <span className="font-bold text-slate-300">Notas: </span>
                        {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Precios y Finanzas */}
                  {canSeeMoney && (
                    <div className="flex lg:flex-col justify-between lg:justify-center lg:items-end gap-1.5 border-t lg:border-t-0 lg:border-l border-outline-variant pt-3 lg:pt-0 lg:pl-5 text-xs font-mono">
                      {expected > 0 && (
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Total: </span>
                          <span className="font-bold">${expected.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      {advance > 0 && (
                        <div className="text-emerald-400">
                          <span className="text-slate-400 text-[11px]">Seña: </span>
                          <span className="font-semibold">${advance.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      {remaining > 0 && expected > 0 ? (
                        <div className="text-amber-400 font-bold">
                          <span className="text-slate-400 text-[11px]">Resta: </span>$
                          {remaining.toLocaleString('es-AR')}
                        </div>
                      ) : expected > 0 && remaining === 0 ? (
                        <div className="text-emerald-400 text-[11px] font-bold">✓ Saldado</div>
                      ) : null}
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-outline-variant pt-3 lg:pt-0 lg:pl-3">
                    {/* Botón WhatsApp */}
                    <button
                      onClick={() => setWhatsAppOrder(order)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                        order.status === 'arrived'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-bounce-short'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                      title="Enviar mensaje por WhatsApp al cliente"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{order.status === 'arrived' ? 'Avisar Llegada' : 'WhatsApp'}</span>
                    </button>

                    {/* Selector Rápido de Estado */}
                    <div className="relative inline-block">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleQuickStatusChange(order, e.target.value as PartOrderStatus)
                        }
                        className="bg-surface-container-highest border border-outline-variant rounded-xl text-xs font-medium text-on-surface py-2 pl-3 pr-8 focus:outline-none focus:border-primary cursor-pointer appearance-none"
                      >
                        <option value="pending">⏳ Pendiente</option>
                        <option value="arrived">📦 Llegó al Taller</option>
                        <option value="delivered">✅ Entregado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Editar */}
                    <button
                      onClick={() => handleOpenEdit(order)}
                      className="p-2 rounded-xl bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Editar Pedido"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setDeletingOrder(order)}
                      className="p-2 rounded-xl bg-surface-container-highest border border-outline-variant text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar Pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal Crear / Editar Pedido */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-title-md font-bold text-on-surface">
                    {editingOrderId ? 'Editar Encargo de Repuesto' : 'Nuevo Pedido de Repuesto'}
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Completá los datos del cliente y la pieza a solicitar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveOrder} className="p-5 flex-1 overflow-y-auto space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Sección de Cliente: Nuevo vs Existente */}
              {!editingOrderId ? (
                <div className="space-y-3 p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl">
                  <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                    <label className="font-label-caps text-xs text-on-surface-variant uppercase font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> Datos del Cliente
                    </label>
                    <div className="flex rounded-lg bg-surface-container-lowest p-0.5 border border-outline-variant/60">
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode('new');
                          handleClearCustomer();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                          clientMode === 'new'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <UserPlus className="w-3 h-3" /> Nuevo
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientMode('existing')}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                          clientMode === 'existing'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" /> Existente
                      </button>
                    </div>
                  </div>

                  {clientMode === 'existing' ? (
                    /* MODO CLIENTE EXISTENTE */
                    <div className="space-y-3">
                      {!selectedCustomer ? (
                        <div className="space-y-2">
                          <label className="block font-bold text-on-surface-variant uppercase text-[10px]">
                            Buscar Cliente Registrado
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                              type="text"
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              placeholder="Buscar por Nombre, DNI o Teléfono..."
                              className="w-full bg-surface-container-highest border border-primary/50 focus:border-primary rounded-xl pl-8 pr-3 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary/50 font-medium"
                              autoFocus
                            />
                          </div>

                          {/* Dropdown predictivo de clientes */}
                          {customerSearchQuery.trim() && (
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto divide-y divide-outline-variant/40">
                              {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((cust) => (
                                  <button
                                    key={cust.id}
                                    type="button"
                                    onClick={() => handleSelectCustomer(cust)}
                                    className="w-full text-left p-2.5 hover:bg-surface-container-high transition-colors flex items-center justify-between group text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-on-surface flex items-center gap-1.5">
                                        <span>{cust.full_name}</span>
                                        {cust.document_id && (
                                          <span className="font-mono text-[10px] text-on-surface-variant/80 bg-surface-container px-1.5 py-0.5 rounded">
                                            DNI: {cust.document_id}
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3 text-primary" /> {cust.phone || 'Sin teléfono'}
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-on-surface-variant text-xs">
                                  No se encontraron clientes con "{customerSearchQuery}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Ficha del cliente seleccionado */
                        <div className="space-y-2.5">
                          <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                {selectedCustomer.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                                  <span>{selectedCustomer.full_name}</span>
                                  {selectedCustomer.document_id && (
                                    <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                                      DNI: {selectedCustomer.document_id}
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-primary" /> {selectedCustomer.phone}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearCustomer}
                              className="text-xs text-primary hover:underline font-semibold px-2 py-1"
                            >
                              Cambiar
                            </button>
                          </div>

                          {/* Equipos registrados del cliente */}
                          {loadingCustomerDevices ? (
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" /> Cargando equipos del cliente...
                            </div>
                          ) : customerDevices.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <label className="block text-[11px] font-bold text-on-surface-variant uppercase">
                                Equipos Registrados (Clic para autocompletar modelo):
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {customerDevices.map((dev) => {
                                  const label = `${dev.brand} ${dev.model}`.trim() || dev.type;
                                  const isSelected = formData.device_model === label;
                                  return (
                                    <button
                                      key={dev.id}
                                      type="button"
                                      onClick={() => handleSelectDevice(dev)}
                                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                                          : 'bg-surface-container-highest border-outline-variant text-on-surface hover:border-primary/50'
                                      }`}
                                    >
                                      <Smartphone className="w-3 h-3" /> {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MODO NUEVO CLIENTE */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                          Nombre del Cliente *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Carlos Gómez"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                          Teléfono / WhatsApp *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 2646211278"
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface font-mono focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Modo Edición: inputs estándar */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Gómez"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 2646211278"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Repuesto y Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                    Repuesto Solicitado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Módulo Display Original, Batería BN56"
                    value={formData.part_name}
                    onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                    Modelo de Equipo / Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Samsung A52 / HP Pavilion"
                    value={formData.device_model}
                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Precios: Seña y Total */}
              {canSeeMoney && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <div>
                    <label className="block font-label-caps text-xs text-emerald-400 uppercase mb-1 font-bold">
                      Seña Recibida ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formData.advance_payment || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, advance_payment: Number(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                      Precio Total Pactado ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formData.expected_price || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_price: Number(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Estado */}
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                  Estado del Pedido
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as PartOrderStatus })
                  }
                  className="w-full px-3.5 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="pending">⏳ Pendiente / En camino</option>
                  <option value="arrived">📦 Llegó al Taller</option>
                  <option value="delivered">✅ Entregado / Colocado</option>
                  <option value="cancelled">❌ Cancelado</option>
                </select>
              </div>

              {/* Notas / Proveedor */}
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1 font-bold">
                  Notas / Proveedor / Nro de Guía
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Pedido a Distribuidora X. Nro seguimiento OCA: 123456. Color azul."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-surface-container-highest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {modalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingOrderId ? 'Guardar Cambios' : 'Registrar Encargo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmación de Eliminación */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-title-md font-bold text-on-surface">¿Eliminar este encargo?</h3>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                Se eliminará el pedido de <strong>{deletingOrder.part_name}</strong> para el cliente{' '}
                <strong>{deletingOrder.customer_name}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingOrder(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal WhatsApp */}
      {whatsAppOrder && (
        <PartOrderWhatsAppModal
          order={whatsAppOrder}
          shop={shop}
          defaultTemplate={whatsAppOrder.status === 'arrived' ? 'arrived' : 'ordered'}
          onClose={() => setWhatsAppOrder(null)}
        />
      )}
    </div>
  );
}
