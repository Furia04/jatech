'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import {
  Search,
  Wrench,
  Check,
  Package,
  Truck,
  Smartphone,
  Calendar,
  MessageSquare,
  LifeBuoy,
  Info,
  Clock,
  AlertTriangle,
  Loader2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { OrderStatus, ServiceOrder } from '@/types';
import { fetchPublicOrdersByDocumentIdOrCode } from '@/lib/supabase/services';

const MOCK_DEMO_ORDERS: ServiceOrder[] = [
  {
    id: 'ord-101',
    shop_id: 'shop-north-station',
    tracking_code: '#WO-8892',
    device_id: 'dev-1',
    customer_id: 'cust-1',
    customer_name: 'Sarah Connor',
    customer_document_id: '38912402',
    customer_phone: '+5491144556677',
    device_info: 'Computadora · Lenovo ThinkPad T14',
    status: 'en_revision',
    reported_fault: 'No enciende tras derrame de líquido sobre teclado',
    technical_diagnosis: 'Limpieza por ultrasonido realizada. Revisando líneas de alimentación de placa madre',
    estimated_completion: '24 Oct 2026, 17:00 hs',
    final_price: 450.0,
    created_at: '2026-10-22T08:00:00Z',
  },
  {
    id: 'ord-102',
    shop_id: 'shop-north-station',
    tracking_code: '#WO-8510',
    device_id: 'dev-2',
    customer_id: 'cust-1',
    customer_name: 'Sarah Connor',
    customer_document_id: '38912402',
    customer_phone: '+5491144556677',
    device_info: 'Smartphone · Apple iPhone 12',
    status: 'para_entregar',
    reported_fault: 'Cambio de módulo de pantalla OLED y batería original',
    technical_diagnosis: 'Instalación y calibración de táctil finalizadas con éxito',
    estimated_completion: 'Listo para retiro',
    final_price: 440.0,
    created_at: '2026-06-20T11:30:00Z',
  },
];

export default function TrackByDniPage() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setSearchedQuery(query.trim());

    try {
      const realOrders = await fetchPublicOrdersByDocumentIdOrCode(query);
      if (realOrders && realOrders.length > 0) {
        setOrders(realOrders);
      } else if (query.includes('38912402') || query.toUpperCase().includes('WO-8892')) {
        // Mock fallback para pruebas
        setOrders(MOCK_DEMO_ORDERS);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepInfo = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return { step: 1, label: 'Recibido en Taller', color: 'text-slate-300', bg: 'bg-slate-800' };
      case 'en_revision':
        return { step: 2, label: 'En Revisión / Diagnóstico', color: 'text-primary', bg: 'bg-primary-container' };
      case 'esperando_repuesto':
        return { step: 2, label: 'Esperando Repuestos', color: 'text-tertiary-fixed', bg: 'bg-tertiary-container' };
      case 'esperando_cliente':
        return { step: 2, label: 'Esperando Resp. Cliente', color: 'text-purple-300', bg: 'bg-purple-900/30' };
      case 'para_entregar':
        return { step: 3, label: '¡Listo para Retirar!', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
      case 'entregado':
        return { step: 4, label: 'Entregado al Cliente', color: 'text-emerald-300', bg: 'bg-emerald-950' };
      case 'abandonado':
        return { step: 4, label: 'Orden Vencida', color: 'text-error', bg: 'bg-error-container/30' };
      default:
        return { step: 1, label: 'En Proceso', color: 'text-slate-300', bg: 'bg-slate-800' };
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex flex-col">
      {/* Encabezado B2C */}
      <header className="bg-surface-container border-b border-outline-variant py-4 px-6 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <Link href="/">
          <Logo size={36} textSubtitle="Seguimiento de Servicio Técnico" />
        </Link>

        <a
          href="https://wa.me/?text=Hola,%20quisiera%20consultar%20por%20mi%20orden%20de%20reparación."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface hover:bg-surface-container-highest transition-colors font-title-sm text-xs font-bold"
        >
          <LifeBuoy className="w-4 h-4 text-primary" /> Contactar Soporte
        </a>
      </header>

      {/* Hero Buscador por DNI / OT */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-label-caps text-xs font-bold uppercase tracking-wider">
            Portal B2C Cliente
          </span>
          <h1 className="font-display-lg text-3xl sm:text-5xl font-bold text-on-surface tracking-tight">
            Consulta el Estado de tu Equipo por DNI
          </h1>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant">
            Ingresa tu número de DNI / CUIT o el código de tu orden para ver el avance en tiempo real de tu reparación.
          </p>
        </div>

        {/* Caja de Búsqueda Destacada */}
        <form
          onSubmit={handleSearch}
          className="w-full bg-surface-container border border-outline-variant rounded-2xl p-3 shadow-xl flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ingresa tu DNI o Código OT (ej: 38912402 o WO-8892)..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3.5 pl-12 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-on-primary hover:bg-primary-container font-title-sm text-sm font-bold px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Consultando...' : 'Buscar Órdenes'}
          </button>
        </form>

        {/* Resultados de la Búsqueda */}
        {hasSearched && (
          <div className="w-full space-y-6 pt-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h2 className="font-title-sm text-lg font-bold text-on-surface">
                Resultados para: <span className="text-primary font-mono">{searchedQuery}</span>
              </h2>
              <span className="font-label-caps text-xs text-on-surface-variant font-bold">
                {orders.length} {orders.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-surface-container border border-outline-variant/60 rounded-2xl p-12 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-error mx-auto" />
                <h3 className="font-title-sm text-lg font-bold text-on-surface">
                  No se encontraron órdenes registradas con ese DNI o código
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant max-w-md mx-auto">
                  Verifica que el número ingresado coincida exactamente con el DNI proporcionado al momento del ingreso de tu equipo.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => {
                  const stepInfo = getStatusStepInfo(ord.status);
                  const waMsg = encodeURIComponent(
                    `Hola, les escribo por la orden de servicio ${ord.tracking_code} (${ord.device_info}) a nombre de ${ord.customer_name}.`
                  );

                  return (
                    <div
                      key={ord.id}
                      className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-lg space-y-6"
                    >
                      {/* Cabecera de la Orden */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-outline-variant/40 pb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono-data font-bold text-primary text-xl">
                              {ord.tracking_code}
                            </span>
                            <span className="font-title-sm text-sm font-bold text-on-surface">
                              {ord.device_info}
                            </span>
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                            Cliente: <strong>{ord.customer_name}</strong> (DNI: {ord.customer_document_id || 'N/A'})
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full font-label-caps text-xs font-bold uppercase ${stepInfo.bg} ${stepInfo.color} border border-current/30`}>
                          {stepInfo.label}
                        </span>
                      </div>

                      {/* Stepper de Proceso B2C */}
                      <div className="py-2">
                        <div className="flex justify-between items-center w-full relative">
                          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0" />
                          <div
                            className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                            style={{
                              width:
                                stepInfo.step === 1 ? '15%' : stepInfo.step === 2 ? '50%' : '100%',
                            }}
                          />

                          <div className="flex flex-col items-center z-10 relative">
                            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center mb-1 text-xs font-bold shadow-md">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="font-label-caps text-[11px] text-on-surface font-semibold">
                              Recibido
                            </span>
                          </div>

                          <div className="flex flex-col items-center z-10 relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                                stepInfo.step >= 2
                                  ? 'bg-primary text-on-primary ring-4 ring-primary/20'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}
                            >
                              <Wrench className="w-4 h-4" />
                            </div>
                            <span className="font-label-caps text-[11px] text-on-surface font-semibold">
                              En Revisión
                            </span>
                          </div>

                          <div className="flex flex-col items-center z-10 relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                                stepInfo.step >= 3
                                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}
                            >
                              <Package className="w-4 h-4" />
                            </div>
                            <span className="font-label-caps text-[11px] text-on-surface font-semibold">
                              Listo para Retirar
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detalles del Estado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 space-y-1">
                          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold">
                            Falla Reportada
                          </span>
                          <p className="text-on-surface font-semibold">{ord.reported_fault}</p>
                        </div>

                        {ord.technical_diagnosis && (
                          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 space-y-1">
                            <span className="font-label-caps text-[10px] text-primary uppercase font-semibold">
                              Diagnóstico Técnico
                            </span>
                            <p className="text-on-surface font-semibold">{ord.technical_diagnosis}</p>
                          </div>
                        )}
                      </div>

                      {/* Presupuesto / Importe Total Visible */}
                      {Boolean(ord.final_price && Number(ord.final_price) > 0) ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="font-label-caps text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                                {ord.status === 'entregado' ? 'Total Abonado' : 'Presupuesto de la Reparación'}
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                {ord.status === 'entregado'
                                  ? 'Equipo retirado y cobrado.'
                                  : ord.status === 'para_entregar'
                                  ? 'Listo para retirar y abonar en el taller.'
                                  : 'Presupuesto establecido por el técnico.'}
                              </span>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/20">
                            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase font-semibold block">
                              Importe
                            </span>
                            <span className="font-mono-data text-2xl font-black text-emerald-400">
                              ${Number(ord.final_price).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/50 flex justify-between items-center text-xs">
                          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Presupuesto
                          </span>
                          <span className="text-on-surface-variant italic text-[11px]">
                            En evaluación / Cotización pendiente
                          </span>
                        </div>
                      )}

                      {/* Footer de la Tarjeta con Enlace y Botón WhatsApp */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-outline-variant/40">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Estimación: <strong>{ord.estimated_completion || 'En diagnóstico'}</strong></span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Link
                            href={`/track/${ord.tracking_code.replace('#', '')}`}
                            className="bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl font-title-sm text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            Ver Detalle <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          </Link>

                          <a
                            href={`https://wa.me/?text=${waMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-title-sm text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="py-6 border-t border-outline-variant text-center text-on-surface-variant font-body-sm text-xs mt-auto">
        <p>© 2026 JaTech. Portal B2C de Seguimiento de Reparaciones.</p>
      </footer>
    </div>
  );
}
