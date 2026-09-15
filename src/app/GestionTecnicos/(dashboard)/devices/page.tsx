'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Tv,
  Gamepad2,
  Watch,
  HardDrive,
  Plus,
  Search,
  Wrench,
  User,
  Calendar,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Edit,
  Clock,
  Package,
} from 'lucide-react';
import { Customer, Device, OrderSpare, ServiceOrder } from '@/types';
import {
  fetchDevices,
  fetchCustomers,
  createDevice,
  fetchDeviceHistory,
  fetchOrderSpares,
  updateDevice,
} from '@/lib/supabase/services';

export default function DevicesPage() {
  const [devices, setDevices] = useState<(Device & { customer_name?: string; customer_phone?: string })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal para Nuevo Dispositivo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    customer_id: '',
    type: 'Smartphone',
    brand: '',
    model: '',
    serial_number: '',
  });

  // Drawer / Modal para Historial del Dispositivo
  const [selectedDeviceHistory, setSelectedDeviceHistory] = useState<{
    device: (Device & { customer_name?: string; customer_phone?: string }) | null;
    orders: (ServiceOrder & { spares?: OrderSpare[] })[];
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal de Edición de Dispositivo
  const [editingDevice, setEditingDevice] = useState<(Device & { customer_name?: string; customer_phone?: string }) | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [devicesData, customersData] = await Promise.all([
          fetchDevices(),
          fetchCustomers(),
        ]);
        setDevices(devicesData || []);
        setCustomers(customersData || []);
      } catch (err) {
        console.error('Error al cargar dispositivos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenHistory = async (deviceId: string) => {
    setLoadingHistory(true);
    try {
      const historyData = await fetchDeviceHistory(deviceId);
      if (historyData?.orders) {
        const ordersWithSpares = await Promise.all(
          historyData.orders.map(async (ord) => {
            const spares = await fetchOrderSpares(ord.id);
            return { ...ord, spares };
          })
        );
        setSelectedDeviceHistory({ ...historyData, orders: ordersWithSpares });
      } else {
        setSelectedDeviceHistory(historyData);
      }
    } catch (err) {
      console.error('Error al cargar historial del equipo:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.customer_id || !newDevice.brand.trim() || !newDevice.model.trim()) return;

    setSavingDevice(true);
    try {
      const created = await createDevice({
        customer_id: newDevice.customer_id,
        type: newDevice.type,
        brand: newDevice.brand,
        model: newDevice.model,
        serial_number: newDevice.serial_number,
      });

      const customerObj = customers.find((c) => c.id === newDevice.customer_id);

      setDevices((prev) => [
        {
          ...created,
          customer_name: customerObj?.full_name || 'Cliente',
          customer_phone: customerObj?.phone || '',
        },
        ...prev,
      ]);

      setShowCreateModal(false);
      setNewDevice({
        customer_id: '',
        type: 'Smartphone',
        brand: '',
        model: '',
        serial_number: '',
      });
    } catch (err) {
      console.error('Error al crear dispositivo:', err);
    } finally {
      setSavingDevice(false);
    }
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    setSavingDevice(true);
    try {
      await updateDevice(editingDevice.id, {
        type: editingDevice.type,
        brand: editingDevice.brand,
        model: editingDevice.model,
        serial_number: editingDevice.serial_number,
      });

      setDevices((prev) =>
        prev.map((d) => (d.id === editingDevice.id ? editingDevice : d))
      );
      setEditingDevice(null);
    } catch (err) {
      console.error('Error al actualizar dispositivo:', err);
    } finally {
      setSavingDevice(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('smart') || t.includes('celular') || t.includes('teléfono') || t.includes('phone')) {
      return <Smartphone className="w-5 h-5 text-purple-400" />;
    }
    if (t.includes('notebook') || t.includes('laptop') || t.includes('macbook')) {
      return <Laptop className="w-5 h-5 text-blue-400" />;
    }
    if (t.includes('tv') || t.includes('tele') || t.includes('monitor') || t.includes('audio')) {
      return <Tv className="w-5 h-5 text-emerald-400" />;
    }
    if (t.includes('play') || t.includes('xbox') || t.includes('console') || t.includes('nintendo') || t.includes('consola')) {
      return <Gamepad2 className="w-5 h-5 text-amber-400" />;
    }
    if (t.includes('watch') || t.includes('reloj')) {
      return <Watch className="w-5 h-5 text-pink-400" />;
    }
    return <HardDrive className="w-5 h-5 text-slate-400" />;
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.serial_number && d.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || d.type.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface">
            Gestión de Dispositivos y Equipos
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
            Administra los equipos registrados, número de serie/IMEI e historial completo de reparaciones.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl font-title-sm text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nuevo Dispositivo
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant p-4 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por marca, modelo, N° de serie, IMEI o cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Chips de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'smartphone', label: 'Smartphones' },
            { id: 'notebook', label: 'Notebooks' },
            { id: 'pc', label: 'Computadoras PC' },
            { id: 'consola', label: 'Consolas' },
            { id: 'tv', label: 'TV / Audio' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-label-caps text-label-caps font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Dispositivos */}
      {loading ? (
        <div className="bg-surface-container rounded-2xl border border-outline-variant p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-body-md text-on-surface-variant">Cargando catálogo de dispositivos...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-surface-container rounded-2xl border border-outline-variant p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <Smartphone className="w-10 h-10 text-on-surface-variant opacity-40" />
          <p className="font-title-sm text-base font-bold text-on-surface">No se encontraron dispositivos</p>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-sm">
            Prueba ajustando los filtros o registra un nuevo equipo asignándolo a un cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className="bg-surface-container rounded-2xl border border-outline-variant p-5 hover:border-primary/50 transition-all flex flex-col justify-between gap-4 shadow-sm group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <span className="font-label-caps text-[10px] uppercase font-bold text-primary">
                        {device.type}
                      </span>
                      <h3 className="font-title-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        {device.brand} {device.model}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingDevice(device)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                    title="Editar Atributos del Equipo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-outline-variant/40 text-xs">
                  {device.serial_number && (
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>N° Serie / IMEI:</span>
                      <span className="font-mono text-on-surface font-semibold bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/60">
                        {device.serial_number}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Propietario:</span>
                    <span className="font-semibold text-on-surface flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" /> {device.customer_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <button
                  onClick={() => handleOpenHistory(device.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-surface-container-high hover:bg-primary/20 text-primary border border-outline-variant hover:border-primary/40 rounded-xl font-title-sm text-xs font-bold transition-all"
                >
                  <Wrench className="w-4 h-4" /> Historial de Reparaciones <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO DISPOSITIVO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" /> Registrar Nuevo Dispositivo
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Cliente Propietario <span className="text-primary">*</span>
                </label>
                <select
                  required
                  value={newDevice.customer_id}
                  onChange={(e) => setNewDevice({ ...newDevice, customer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.full_name} ({cust.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">
                    Tipo / Rubro <span className="text-primary">*</span>
                  </label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Smartphone">Smartphone</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Computadora PC">Computadora PC</option>
                    <option value="Consola">Consola de Juegos</option>
                    <option value="TV / Audio">TV / Audio</option>
                    <option value="Smartwatch">Smartwatch</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">
                    Marca <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Apple, Samsung..."
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Modelo del Equipo <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: iPhone 13 Pro, Galaxy S22..."
                  value={newDevice.model}
                  onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  N° de Serie / IMEI (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 35489100293847..."
                  value={newDevice.serial_number}
                  onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-on-surface font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDevice}
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-bold flex items-center gap-2"
                >
                  {savingDevice && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR DISPOSITIVO */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" /> Editar Atributos del Equipo
              </h3>
              <button
                onClick={() => setEditingDevice(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDevice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Tipo</label>
                  <input
                    type="text"
                    value={editingDevice.type}
                    onChange={(e) => setEditingDevice({ ...editingDevice, type: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Marca</label>
                  <input
                    type="text"
                    value={editingDevice.brand}
                    onChange={(e) => setEditingDevice({ ...editingDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Modelo</label>
                <input
                  type="text"
                  value={editingDevice.model}
                  onChange={(e) => setEditingDevice({ ...editingDevice, model: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">N° de Serie / IMEI</label>
                <input
                  type="text"
                  value={editingDevice.serial_number || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, serial_number: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-xl text-on-surface font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDevice}
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-bold flex items-center gap-2"
                >
                  {savingDevice && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL HISTORIAL COMPLETO DEL DISPOSITIVO */}
      {(selectedDeviceHistory || loadingHistory) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-surface-container border-l border-outline-variant w-full max-w-xl h-full p-6 flex flex-col space-y-6 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-4">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">HISTORIAL TÉCNICO Y REPARACIONES</span>
                <h3 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2">
                  {selectedDeviceHistory?.device ? (
                    <>
                      {selectedDeviceHistory.device.brand} {selectedDeviceHistory.device.model}
                    </>
                  ) : (
                    'Cargando historial...'
                  )}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDeviceHistory(null)}
                className="p-2 hover:bg-surface-container-highest rounded-xl text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-semibold">Consultando historial del equipo...</p>
              </div>
            ) : selectedDeviceHistory?.device ? (
              <div className="space-y-6 flex-1">
                {/* Ficha Técnica del Dispositivo */}
                <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/60 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-on-surface-variant">Tipo:</span>{' '}
                      <span className="font-semibold text-on-surface">{selectedDeviceHistory.device.type}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">N° Serie / IMEI:</span>{' '}
                      <span className="font-mono text-on-surface font-semibold bg-surface-container p-1 rounded">
                        {selectedDeviceHistory.device.serial_number || 'N/D'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Cliente Propietario:</span>{' '}
                    <span className="font-semibold text-primary">{selectedDeviceHistory.device.customer_name}</span> ({selectedDeviceHistory.device.customer_phone})
                  </div>
                </div>

                {/* Historial de Órdenes de Servicio */}
                <div className="space-y-3">
                  <h4 className="font-title-sm text-xs uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" /> Historial de Órdenes ({selectedDeviceHistory.orders.length})
                  </h4>

                  {selectedDeviceHistory.orders.length === 0 ? (
                    <div className="bg-surface-container-low rounded-xl p-6 text-center text-on-surface-variant border border-outline-variant/40">
                      <p className="text-xs">Este equipo aún no tiene órdenes de servicio registradas.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDeviceHistory.orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-surface-container-high rounded-xl p-4 border border-outline-variant space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
                            <span className="font-mono text-primary font-bold text-sm">
                              {ord.tracking_code}
                            </span>
                            <span className="font-label-caps text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {ord.status.toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <span className="text-on-surface-variant font-semibold">Falla Reportada:</span>
                            <p className="text-on-surface font-medium mt-0.5">{ord.reported_fault}</p>
                          </div>

                          {ord.technical_diagnosis && (
                            <div>
                              <span className="text-on-surface-variant font-semibold">Diagnóstico Técnico:</span>
                              <p className="text-on-surface bg-surface-container p-2 rounded mt-0.5 border border-outline-variant/40">
                                {ord.technical_diagnosis}
                              </p>
                            </div>
                          )}

                          {ord.warranty_period && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded flex items-center justify-between text-emerald-400">
                              <span className="font-bold flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4" /> Garantía Otorgada: {ord.warranty_period}
                              </span>
                              {ord.warranty_until && (
                                <span className="text-[10px]">
                                  Vence: {new Date(ord.warranty_until).toLocaleDateString('es-AR')}
                                </span>
                              )}
                            </div>
                          )}

                          {ord.spares && ord.spares.length > 0 && (
                            <div className="bg-surface-container rounded-lg p-2.5 border border-outline-variant/40 space-y-1.5 mt-2">
                              <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-primary" /> Repuestos Instalados en Equipo
                              </span>
                              <div className="space-y-1">
                                {ord.spares.map((sp) => (
                                  <div key={sp.id} className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-on-surface">
                                      {sp.name} ({sp.sku}) x{sp.quantity}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        sp.status === 'reserved'
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          : sp.status === 'consumed'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-surface-container-highest text-on-surface-variant line-through'
                                      }`}
                                    >
                                      {sp.status === 'reserved' ? '🟡 En Custodia' : sp.status === 'consumed' ? '🟢 Consumido' : '⚪ Deuelto'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 text-[11px] text-on-surface-variant border-t border-outline-variant/40">
                            <span>Ingreso: {new Date(ord.created_at).toLocaleDateString('es-AR')}</span>
                            {Boolean(ord.final_price) && ord.final_price! > 0 && (
                              <span className="font-mono text-emerald-400 font-bold text-xs">
                                ${Number(ord.final_price).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
