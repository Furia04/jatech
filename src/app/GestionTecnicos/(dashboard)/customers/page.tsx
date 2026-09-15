'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Smartphone,
  MessageSquare,
  History,
  Loader2,
  X,
  Save,
  FolderOpen,
  UserCheck,
} from 'lucide-react';
import { Customer, Device, ServiceOrder, OrderStatus } from '@/types';
import {
  fetchCustomers,
  createCustomer,
  fetchCustomerDevicesAndOrders,
} from '@/lib/supabase/services';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estado para dispositivos y órdenes del cliente seleccionado
  const [customerDevices, setCustomerDevices] = useState<Device[]>([]);
  const [customerOrders, setCustomerOrders] = useState<ServiceOrder[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Estado para Modal de Alta de Cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDocumentId, setNewDocumentId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadCustomersData = async () => {
    setLoading(true);
    try {
      const realCustomers = await fetchCustomers();
      setCustomers(realCustomers || []);
      if (realCustomers && realCustomers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(realCustomers[0].id);
      }
    } catch (err) {
      console.error('Error al cargar clientes de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomersData();
  }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedCustomerId) {
        setCustomerDevices([]);
        setCustomerOrders([]);
        return;
      }
      setDetailsLoading(true);
      try {
        const { devices, orders } = await fetchCustomerDevicesAndOrders(selectedCustomerId);
        setCustomerDevices(devices || []);
        setCustomerOrders(orders || []);
      } catch (err) {
        console.error('Error al cargar detalles de cliente:', err);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadDetails();
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.document_id && c.document_id.includes(searchQuery)) ||
      c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      setModalError('Nombre completo y teléfono son obligatorios.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const created = await createCustomer({
        full_name: newFullName,
        phone: newPhone,
        document_id: newDocumentId,
        email: newEmail,
      });

      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
      setNewFullName('');
      setNewPhone('');
      setNewDocumentId('');
      setNewEmail('');
      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar cliente en Supabase');
    } finally {
      setModalLoading(false);
    }
  };

  const waMessage = selectedCustomer
    ? encodeURIComponent(
        `Hola ${selectedCustomer.full_name}, nos comunicamos desde el taller técnico sobre sus equipos y reparaciones.`
      )
    : '';
  const waUrl = selectedCustomer
    ? `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${waMessage}`
    : '#';

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">Recibido</span>;
      case 'en_revision':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-primary-container/20 text-primary border border-primary/30 uppercase">En Revisión</span>;
      case 'esperando_repuesto':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-tertiary-container/20 text-tertiary border border-tertiary-container/30 uppercase">Espera Repuesto</span>;
      case 'esperando_cliente':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-purple-900/30 text-purple-300 border border-purple-500/30 uppercase">Esperando Resp. Cliente</span>;
      case 'para_entregar':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 uppercase">Para Entregar</span>;
      case 'abandonado':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold bg-error-container/30 text-error border border-error/30 uppercase">Abandonado</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <h2 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" /> Clientes e Historial por DNI
          </h2>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Consulta el historial completo de equipos, reparaciones y datos reales de cada cliente en Supabase.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-on-primary font-title-sm text-xs px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 shadow-md font-bold"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Buscador Destacado por DNI / Nombre / Teléfono */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente por DNI / CUIT, Nombre o Teléfono..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 font-body-sm text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs">Cargando clientes de la base de datos Supabase...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-16 text-center space-y-3 shadow-sm">
          <FolderOpen className="w-12 h-12 text-on-surface-variant mx-auto opacity-50" />
          <h3 className="font-title-sm text-base font-bold text-on-surface">No hay clientes registrados</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Comienza dando de alta a tu primer cliente para relacionarle equipos y órdenes de servicio.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-xl text-xs font-bold shadow transition-all mt-2"
          >
            <Plus className="w-4 h-4" /> Registrar Primer Cliente
          </button>
        </div>
      ) : (
        /* Layout Principal en Dos Columnas Ergonómicas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Lista de Clientes (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="font-label-caps text-xs text-on-surface-variant uppercase font-bold px-1">
              Clientes Registrados ({filteredCustomers.length})
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-surface-container-high border-primary shadow-md'
                        : 'bg-surface-container border-outline-variant/60 hover:border-outline hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-title-sm text-sm font-bold text-on-surface">
                        {cust.full_name}
                      </h4>
                      <span
                        className={`font-mono-data text-[11px] font-bold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-bright text-on-surface-variant'
                        }`}
                      >
                        DNI: {cust.document_id || 'S/D'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Detalle e Historial del Cliente Seleccionado (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedCustomer ? (
              <>
                {/* Ficha del Cliente */}
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/40 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-title-sm text-xl font-bold text-on-surface">
                          {selectedCustomer.full_name}
                        </h3>
                        <span className="font-mono-data text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30">
                          DNI: {selectedCustomer.document_id || 'Sin especificar'}
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                        Registrado el {new Date(selectedCustomer.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>

                    {/* Botón WhatsApp */}
                    {selectedCustomer.phone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 px-4 py-2 rounded-xl font-title-sm text-xs flex items-center gap-2 transition-colors font-bold"
                      >
                        <MessageSquare className="w-4 h-4" /> Contactar por WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2.5 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                          Teléfono
                        </span>
                        <span className="font-mono-data text-on-surface font-semibold">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                          Correo Electrónico
                        </span>
                        <span className="font-mono-data text-on-surface font-semibold truncate">
                          {selectedCustomer.email || 'No registrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {detailsLoading ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-on-surface-variant text-xs">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" /> Cargando historial de equipos del cliente...
                  </div>
                ) : (
                  <>
                    {/* Equipos Registrados del Cliente */}
                    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 text-primary font-title-sm font-bold border-b border-outline-variant/40 pb-3">
                        <Smartphone className="w-5 h-5" />
                        <h3>Equipos Registrados ({customerDevices.length})</h3>
                      </div>

                      {customerDevices.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic">
                          Este cliente no tiene equipos registrados en la base de datos aún.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customerDevices.map((dev) => (
                            <div
                              key={dev.id}
                              className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 flex flex-col justify-between gap-2"
                            >
                              <div>
                                <span className="font-label-caps text-[10px] text-primary uppercase font-bold px-2 py-0.5 bg-primary/10 rounded-md">
                                  {dev.type}
                                </span>
                                <h4 className="font-title-sm text-sm font-bold text-on-surface mt-2">
                                  {dev.brand} {dev.model}
                                </h4>
                                <p className="font-mono-data text-[11px] text-on-surface-variant mt-0.5">
                                  SN/IMEI: {dev.serial_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Historial Completo de Órdenes por Cliente */}
                    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 text-primary font-title-sm font-bold border-b border-outline-variant/40 pb-3">
                        <History className="w-5 h-5" />
                        <h3>Historial de Órdenes de Servicio ({customerOrders.length})</h3>
                      </div>

                      {customerOrders.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic">
                          No hay órdenes registradas históricamente para este cliente.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {customerOrders.map((ord) => (
                            <div
                              key={ord.id}
                              className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-outline-variant/30 pb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono-data font-bold text-primary text-sm">
                                    {ord.tracking_code}
                                  </span>
                                  <span className="text-xs text-on-surface font-semibold">
                                    {ord.device_info}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {renderStatusBadge(ord.status)}
                                  <span className="text-xs text-on-surface font-bold font-mono-data">
                                    ${(ord.final_price || 0).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>

                              <div className="text-xs space-y-1">
                                <p className="text-on-surface">
                                  <strong className="text-on-surface-variant">Falla Reportada:</strong>{' '}
                                  {ord.reported_fault}
                                </p>
                                {ord.technical_diagnosis && (
                                  <p className="text-on-surface-variant bg-surface-container-low p-2 rounded-lg border border-outline-variant/40 mt-1">
                                    <strong>Diagnóstico Técnico:</strong> {ord.technical_diagnosis}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant text-xs">
                Selecciona un cliente de la lista para ver su información y órdenes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA DAR DE ALTA UN NUEVO CLIENTE REAL EN SUPABASE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="font-title-sm text-base font-bold text-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Registrar Nuevo Cliente en Supabase
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {modalError && (
              <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-xs font-semibold">
                {modalError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ej: Sarah Connor"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant uppercase mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 4455 6677"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-xs text-on-surface font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    DNI / CUIT / Identificación
                  </label>
                  <input
                    type="text"
                    value={newDocumentId}
                    onChange={(e) => setNewDocumentId(e.target.value)}
                    placeholder="Ej: 38912402"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={modalLoading}
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-title-sm text-on-surface-variant hover:bg-surface-container-highest rounded-xl disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="bg-primary text-on-primary font-title-sm text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalLoading ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
