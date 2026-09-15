'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  DollarSign,
  Calculator,
  RotateCcw,
  Sparkles,
  Users,
  Package,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import { InventoryItem, OrderStatus, ServiceOrder, UserProfile } from '@/types';
import { BudgetCalculator } from '@/components/orders/budget-calculator';
import { WhatsAppModal } from '@/components/orders/whatsapp-modal';
import { CashRegisterModal } from '@/components/dashboard/cash-register-modal';

const DEMO_USER: UserProfile = {
  id: 'user-demo-001',
  email: 'demo@taller.com',
  full_name: 'Técnico Demo',
  role: 'owner',
  shop_id: 'shop-demo-sandbox',
  can_view_financials: true,
};

const INITIAL_DEMO_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-demo-1',
    shop_id: 'shop-demo-sandbox',
    sku: 'SCR-IP13P-01',
    name: 'Pantalla iPhone 13 Pro (OLED)',
    category: 'Pantallas',
    stock: 20,
    min_stock: 5,
    cost: 120.0,
    price: 250.0,
    created_at: '2026-10-01',
  },
  {
    id: 'inv-demo-2',
    shop_id: 'shop-demo-sandbox',
    sku: 'BAT-SS21-02',
    name: 'Batería Samsung S21 (4000mAh)',
    category: 'Baterías',
    stock: 4,
    min_stock: 8,
    cost: 25.0,
    price: 75.0,
    created_at: '2026-10-05',
  },
];

const INITIAL_DEMO_ORDERS: ServiceOrder[] = [
  {
    id: 'wo-demo-1',
    shop_id: 'shop-demo-sandbox',
    tracking_code: '#WO-8891',
    device_id: 'dev-demo-1',
    customer_id: 'cust-demo-1',
    customer_name: 'Sarah Jenkins',
    customer_document_id: '35123987',
    customer_phone: '+5491188990011',
    device_info: 'Smartphone · iPhone 13 Pro',
    status: 'en_revision',
    reported_fault: 'Pantalla rota y el módulo de carga no detecta el cable',
    technical_diagnosis: 'Revisando líneas de alimentación y conector flex',
    estimated_completion: '25 Oct 2026',
    final_price: 250.0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'wo-demo-2',
    shop_id: 'shop-demo-sandbox',
    tracking_code: '#WO-8890',
    device_id: 'dev-demo-2',
    customer_id: 'cust-demo-2',
    customer_name: 'Global Logistics LLC',
    customer_document_id: '30999888',
    customer_phone: '+5491122334455',
    device_info: 'Scanner · Zebra TC52',
    status: 'para_entregar',
    reported_fault: 'Reemplazo de cristal óptico de escáner láser',
    technical_diagnosis: 'Lente reemplazado y calibración completada',
    estimated_completion: 'Listo para retiro',
    final_price: 95.0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export default function InteractiveDemoPage() {
  const [demoOrders, setDemoOrders] = useState<ServiceOrder[]>(INITIAL_DEMO_ORDERS);
  const [demoInventory, setDemoInventory] = useState<InventoryItem[]>(INITIAL_DEMO_INVENTORY);
  const [activeTab, setActiveTab] = useState<'orders' | 'intake' | 'inventory'>('orders');

  // Estado para la Ventana Emergente Modal en Demo
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'budget'>('details');
  const [copiedLink, setCopiedLink] = useState(false);
  const [whatsappOrder, setWhatsappOrder] = useState<ServiceOrder | null>(null);
  const [showCashRegister, setShowCashRegister] = useState(false);

  // Estado para Nueva Orden Rápida en el Demo
  const [newCustName, setNewCustName] = useState('');
  const [newCustDni, setNewCustDni] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newDevType, setNewDevType] = useState('Smartphone');
  const [newDevBrand, setNewDevBrand] = useState('');
  const [newDevModel, setNewDevModel] = useState('');
  const [newFault, setNewFault] = useState('');

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Reset de la Demo a estado 0 / Inicial
  const handleResetDemo = () => {
    setDemoOrders(INITIAL_DEMO_ORDERS);
    setDemoInventory(INITIAL_DEMO_INVENTORY);
    setEditingOrder(null);
    setActiveTab('orders');
    alert('Demo reiniciada al estado inicial.');
  };

  // Crear nueva orden en memoria local
  const handleCreateDemoOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newDevBrand || !newDevModel || !newFault) {
      alert('Completa los campos obligatorios del formulario demo.');
      return;
    }

    const randomCode = `#WO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrd: ServiceOrder = {
      id: `wo-demo-${Date.now()}`,
      shop_id: 'shop-demo-sandbox',
      tracking_code: randomCode,
      device_id: `dev-${Date.now()}`,
      customer_id: `cust-${Date.now()}`,
      customer_name: newCustName,
      customer_document_id: newCustDni || 'N/A',
      customer_phone: newCustPhone,
      device_info: `${newDevType} · ${newDevBrand} ${newDevModel}`,
      status: 'recibido',
      reported_fault: newFault,
      technical_diagnosis: 'Pendiente de diagnóstico',
      final_price: 0,
      created_at: new Date().toISOString(),
    };

    setDemoOrders((prev) => [newOrd, ...prev]);

    // Limpiar formulario y volver a órdenes
    setNewCustName('');
    setNewCustDni('');
    setNewCustPhone('');
    setNewDevBrand('');
    setNewDevModel('');
    setNewFault('');
    setActiveTab('orders');
  };

  const handleSaveModal = () => {
    if (!editingOrder) return;
    setDemoOrders((prev) =>
      prev.map((o) => (o.id === editingOrder.id ? editingOrder : o))
    );
    setEditingOrder(null);
  };

  const filteredOrders = demoOrders.filter((ord) => {
    const matchesFilter = activeFilter === 'all' || ord.status === activeFilter;
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

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] uppercase font-bold">Recibido</span>;
      case 'en_revision':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary border border-primary/30 text-[10px] uppercase font-bold">En Revisión</span>;
      case 'esperando_repuesto':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary border border-tertiary-container/30 text-[10px] uppercase font-bold">Esperando Repuesto</span>;
      case 'esperando_cliente':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-500/30 text-[10px] uppercase font-bold">Esperando Resp. Cliente</span>;
      case 'para_entregar':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold">Para Entregar</span>;
      case 'abandonado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-error-container/30 text-error border border-error/30 text-[10px] uppercase font-bold">Abandonado</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* BANNER NOTIFICACIÓN MODO DEMO INTERACTIVO */}
      <div className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 text-white py-2.5 px-6 flex flex-wrap justify-between items-center text-xs font-bold shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>MODO DEMO INTERACTIVO VIRTUAL — Los cambios son locales y efímeros (no se guardan en la base de datos real).</span>
        </div>

        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <button
            onClick={handleResetDemo}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-[11px] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Demo a 0
          </button>
          <Link
            href="/GestionTecnicos/register"
            className="bg-white text-primary hover:bg-white/90 px-3 py-1 rounded text-[11px] font-bold shadow transition-colors"
          >
            Crear Mi Taller Real
          </Link>
        </div>
      </div>

      {/* HEADER DE LA DEMO */}
      <header className="bg-surface-container border-b border-outline-variant px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-headline-md text-base font-bold text-primary">
              JaTech <span className="text-xs text-on-surface-variant font-normal">(Software para técnicos - Sandbox Demo)</span>
            </h1>
          </div>
        </div>

        {/* Pestañas de Navegación del Sandbox Demo */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Wrench className="w-4 h-4" /> Órdenes ({demoOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'intake'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Plus className="w-4 h-4" /> + Nueva Orden (Ingreso)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Package className="w-4 h-4" /> Inventario ({demoInventory.length})
          </button>
          <button
            onClick={() => setShowCashRegister(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 shadow-sm"
          >
            <DollarSign className="w-4 h-4" /> Cierre de Caja
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL INTERACTIVO EN MEMORIA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* PESTAÑA 1: LISTADO DE ÓRDENES DEMO */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-4">
              <div>
                <h2 className="font-display-lg text-2xl font-bold text-on-surface">
                  Órdenes de Servicio (Prueba en Vivo)
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Haz clic en cualquier orden para abrir la ventana emergente, modificar estados o simular presupuestos.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('intake')}
                className="bg-primary-container text-on-primary-container hover:bg-primary font-title-sm text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nueva Orden Demo
              </button>
            </div>

            {/* Filtros Rápido */}
            <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {['all', 'recibido', 'en_revision', 'esperando_repuesto', 'para_entregar'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-label-caps border transition-colors ${
                      activeFilter === f
                        ? 'bg-secondary-container text-on-secondary-container border-primary font-bold'
                        : 'bg-surface border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {f === 'all' ? 'Todas' : f}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en la demo..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-1.5 pl-9 pr-3 text-xs text-on-surface"
                />
              </div>
            </div>

            {/* Tabla de Órdenes */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="bg-surface-container border-b border-outline-variant">
                    <tr>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant">Código OT</th>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant">Cliente (DNI)</th>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant">Dispositivo</th>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant">Estado</th>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant text-right">Monto</th>
                      <th className="p-3 font-label-caps uppercase text-on-surface-variant text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50 font-mono-data">
                    {sortedOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => {
                          setEditingOrder(ord);
                          setActiveModalTab('details');
                        }}
                        className="hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <td className="p-3 text-primary font-bold">{ord.tracking_code}</td>
                        <td className="p-3 text-on-surface font-sans">
                          <strong>{ord.customer_name}</strong> (DNI: {ord.customer_document_id})
                        </td>
                        <td className="p-3 text-on-surface-variant font-sans">{ord.device_info}</td>
                        <td className="p-3">{getStatusBadge(ord.status)}</td>
                        <td className="p-3 text-right font-bold">${ord.final_price?.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWhatsappOrder(ord);
                              }}
                              className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Notificar por WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOrder(ord);
                                setActiveModalTab('details');
                              }}
                              className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                              title="Editar Orden / Presupuestar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PUNTO DE RECEPCIÓN Y NUEVA ORDEN DEMO */}
        {activeTab === 'intake' && (
          <form onSubmit={handleCreateDemoOrder} className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-outline-variant/60 pb-3">
              <h2 className="font-display-lg text-2xl font-bold text-on-surface">
                Simulador de Recepción de Equipo
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Crea una orden de prueba en memoria local para probar el flujo de ingreso.
              </p>
            </div>

            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant space-y-4">
              <h3 className="font-title-sm text-sm font-bold text-primary uppercase font-mono">1. Datos del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Ej: Sarah Connor"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={newCustDni}
                    onChange={(e) => setNewCustDni(e.target.value)}
                    placeholder="Ej: 38912402"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+5491144556677"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant space-y-4">
              <h3 className="font-title-sm text-sm font-bold text-primary uppercase font-mono">2. Dispositivo & Falla</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Tipo</label>
                  <select
                    value={newDevType}
                    onChange={(e) => setNewDevType(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs"
                  >
                    <option>Smartphone</option>
                    <option>Computadora / Laptop</option>
                    <option>Tablet</option>
                    <option>Consola</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={newDevBrand}
                    onChange={(e) => setNewDevBrand(e.target.value)}
                    placeholder="Ej: Apple"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={newDevModel}
                    onChange={(e) => setNewDevModel(e.target.value)}
                    placeholder="Ej: iPhone 13 Pro"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Falla Reportada *</label>
                <textarea
                  required
                  value={newFault}
                  onChange={(e) => setNewFault(e.target.value)}
                  rows={3}
                  placeholder="Describa la falla reportada..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary hover:bg-primary-container font-title-sm text-sm font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear Orden en Memoria Local Demo
            </button>
          </form>
        )}

        {/* PESTAÑA 3: INVENTARIO DEMO */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="border-b border-outline-variant/60 pb-3 flex justify-between items-center">
              <div>
                <h2 className="font-display-lg text-2xl font-bold text-on-surface">
                  Inventario de Repuestos (Demo)
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Repuestos de prueba que pueden asignarse al presupuestar en el sandbox.
                </p>
              </div>

              <button
                onClick={() => {
                  const name = prompt('Nombre del repuesto demo:');
                  if (!name) return;
                  const price = parseFloat(prompt('Precio de venta ($):', '100') || '100');
                  setDemoInventory((prev) => [
                    ...prev,
                    {
                      id: `inv-demo-${Date.now()}`,
                      shop_id: 'shop-demo-sandbox',
                      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
                      name,
                      category: 'Repuestos',
                      stock: 10,
                      min_stock: 2,
                      cost: price * 0.5,
                      price,
                      created_at: new Date().toISOString(),
                    },
                  ]);
                }}
                className="bg-primary-container text-on-primary-container font-title-sm text-xs font-bold px-4 py-2 rounded-lg"
              >
                + Agregar Repuesto Demo
              </button>
            </div>

            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-container border-b border-outline-variant font-label-caps uppercase text-on-surface-variant">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Nombre Repuesto</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Precio Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 font-mono-data">
                  {demoInventory.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 text-on-surface-variant">{item.sku}</td>
                      <td className="p-3 font-sans font-bold text-on-surface">{item.name}</td>
                      <td className="p-3 text-emerald-400 font-bold">{item.stock} unidades</td>
                      <td className="p-3 text-right font-bold">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE EDICIÓN Y PRESUPUESTO EN DEMO */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
              <div>
                <h3 className="font-title-sm text-lg font-bold text-primary">
                  Edición Demo: {editingOrder.tracking_code}
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Cliente: {editingOrder.customer_name} ({editingOrder.device_info})
                </p>
              </div>
              <button onClick={() => setEditingOrder(null)}>
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex gap-2 px-6 border-b border-outline-variant/50 bg-surface-container-low pt-3">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`px-4 py-2 font-title-sm text-xs border-b-2 font-bold ${
                  activeModalTab === 'details' ? 'border-primary text-primary' : 'text-on-surface-variant'
                }`}
              >
                Detalles de Orden
              </button>
              <button
                onClick={() => setActiveModalTab('budget')}
                className={`px-4 py-2 font-title-sm text-xs border-b-2 font-bold ${
                  activeModalTab === 'budget' ? 'border-emerald-400 text-emerald-400' : 'text-on-surface-variant'
                }`}
              >
                Presupuestador Sandbox
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {activeModalTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase mb-1">Estado de Orden</label>
                    <select
                      value={editingOrder.status}
                      onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as OrderStatus })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-xs font-semibold"
                    >
                      <option value="recibido">Recibido</option>
                      <option value="en_revision">En Revisión</option>
                      <option value="esperando_repuesto">Esperando Repuesto</option>
                      <option value="para_entregar">Para Entregar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant uppercase mb-1">Diagnóstico Técnico</label>
                    <textarea
                      value={editingOrder.technical_diagnosis || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, technical_diagnosis: e.target.value })}
                      rows={3}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {activeModalTab === 'budget' && (
                <BudgetCalculator
                  order={editingOrder}
                  user={DEMO_USER}
                  availableInventory={demoInventory}
                  onSaveBudget={(labor, parts, finalPrice) => {
                    setEditingOrder({ ...editingOrder, final_price: finalPrice });
                    setActiveModalTab('details');
                  }}
                />
              )}
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-container-high flex justify-end gap-3">
              <button onClick={() => setEditingOrder(null)} className="px-4 py-2 text-xs text-on-surface-variant">
                Cancelar
              </button>
              <button onClick={handleSaveModal} className="bg-primary text-on-primary px-5 py-2 rounded-lg font-bold text-xs">
                Guardar en Demo Local
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE WHATSAPP EN DEMO */}
      {whatsappOrder && (
        <WhatsAppModal
          order={whatsappOrder}
          shop={{
            id: 'shop-demo-sandbox',
            name: 'JaTech Demo Lab',
            owner_email: 'demo@taller.com',
            subscription_status: 'active',
            settings: {
              phone: '+5491100001111',
            },
            created_at: new Date().toISOString(),
          }}
          onClose={() => setWhatsappOrder(null)}
        />
      )}

      {/* MODAL DE CIERRE DE CAJA EN DEMO */}
      {showCashRegister && (
        <CashRegisterModal
          isOpen={showCashRegister}
          onClose={() => setShowCashRegister(false)}
          orders={demoOrders}
          shop={{
            id: 'shop-demo-sandbox',
            name: 'JaTech Demo Lab',
            owner_email: 'demo@taller.com',
            subscription_status: 'active',
            settings: {
              phone: '+5491100001111',
            },
            created_at: new Date().toISOString(),
          }}
        />
      )}
    </div>
  );
}
