'use client';

import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Check,
  Package,
  Truck,
  Smartphone,
  Calendar,
  MessageSquare,
  LifeBuoy,
  Info,
  Loader2,
  AlertCircle,
  FileText,
  Search,
  ShieldCheck,
  DollarSign,
  Clock,
} from 'lucide-react';
import { OrderStatus, ServiceOrder } from '@/types';
import { fetchPublicOrdersByDocumentIdOrCode } from '@/lib/supabase/services';
import Link from 'next/link';

interface TrackPageProps {
  params: {
    tracking_code: string;
  };
}

export default function TrackOrderPage({ params }: TrackPageProps) {
  const trackingCodeParam = decodeURIComponent(params.tracking_code).trim();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState(trackingCodeParam);

  useEffect(() => {
    let isMounted = true;

    async function loadTrackingData() {
      setLoading(true);
      try {
        const results = await fetchPublicOrdersByDocumentIdOrCode(trackingCodeParam);
        if (isMounted) {
          setOrders(results);
          if (results.length > 0) {
            setSelectedOrder(results[0]);
          } else {
            setSelectedOrder(null);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de seguimiento:', err);
        if (isMounted) {
          setOrders([]);
          setSelectedOrder(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (trackingCodeParam) {
      loadTrackingData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [trackingCodeParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cleanCode = searchQuery.trim().replace(/^#/, '');
    window.location.href = `/track/${encodeURIComponent(cleanCode)}`;
  };

  const getStatusStepIndex = (status?: OrderStatus): number => {
    switch (status) {
      case 'recibido':
        return 0;
      case 'en_revision':
      case 'esperando_repuesto':
      case 'esperando_cliente':
        return 1;
      case 'para_entregar':
        return 2;
      case 'entregado':
        return 3;
      case 'abandonado':
        return -1;
      default:
        return 0;
    }
  };

  const getStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return { label: 'RECIBIDO', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'en_revision':
        return { label: 'EN REVISIÓN', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse' };
      case 'esperando_repuesto':
        return { label: 'ESPERANDO REPUESTO', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'esperando_cliente':
        return { label: 'ESPERANDO CLIENTE', bg: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
      case 'para_entregar':
        return { label: 'LISTO PARA RETIRAR', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'entregado':
        return { label: 'EQUIPO ENTREGADO', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'abandonado':
        return { label: 'ABANDONADO / CANCELADO', bg: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: 'EN PROCESO', bg: 'bg-primary-container text-on-primary-container' };
    }
  };

  const getStatusDescription = (status?: OrderStatus) => {
    switch (status) {
      case 'recibido':
        return 'Tu equipo ingresó a nuestro taller y está en cola para inspección técnica inicial.';
      case 'en_revision':
        return 'Tu equipo está siendo diagnosticado por nuestros técnicos para verificar la falla.';
      case 'esperando_repuesto':
        return 'El equipo requiere repuestos específicos y estamos a la espera de la entrega por parte del proveedor.';
      case 'esperando_cliente':
        return 'Hemos generado la cotización o diagnóstico de reparación y estamos esperando tu respuesta.';
      case 'para_entregar':
        return '¡Tu equipo ya está listo! Puedes pasar por la sucursal a retirarlo en nuestro horario de atención.';
      case 'entregado':
        return 'El equipo ha sido entregado exitosamente al cliente junto a su comprobante de garantía.';
      case 'abandonado':
        return 'La orden fue archivada o abandonada.';
      default:
        return 'Consulta el avance de tu orden de reparación.';
    }
  };

  const shopName = 'Sistema de Atención Técnica';
  const shopPhone = '+5491122334455';

  const waMessage = encodeURIComponent(
    `Hola, quisiera consultar por el estado de la orden de servicio #${selectedOrder?.tracking_code || trackingCodeParam}.`
  );
  const waUrl = `https://wa.me/${shopPhone.replace(/[^0-9]/g, '')}?text=${waMessage}`;

  const currentStep = getStatusStepIndex(selectedOrder?.status);
  const badgeInfo = getStatusBadge(selectedOrder?.status);

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex flex-col">
      {/* Encabezado B2C */}
      <header className="bg-surface-container border-b border-outline-variant py-4 px-gutter flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary-container">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-headline-md text-title-sm font-bold text-primary">
              {shopName}
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              Seguimiento Público de Reparación
            </p>
          </div>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-highest transition-colors font-label-caps text-label-caps"
        >
          <LifeBuoy className="w-4 h-4 text-primary" /> Contactar Soporte
        </a>
      </header>

      {/* Cuerpo Principal */}
      <main className="flex-1 flex justify-center items-start p-container-margin md:p-[48px]">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {/* Título de Página */}
          <div className="text-center mb-2">
            <h2 className="font-display-lg text-display-lg text-on-surface mb-2">
              Estado de tu Reparación
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Consulta en tiempo real el progreso de tu equipo técnico.
            </p>
          </div>

          {/* Buscador Rápido de Código / DNI */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md mx-auto w-full mb-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ingresa Código (#WO-XXXX) o DNI..."
                className="w-full pl-9 pr-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Estado de Carga */}
          {loading && (
            <div className="bg-surface-container rounded-xl border border-outline-variant p-12 text-center flex flex-col items-center justify-center gap-3 shadow-md">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-body-md text-on-surface-variant">
                Buscando orden de servicio...
              </p>
            </div>
          )}

          {/* Estado de Sin Resultados */}
          {!loading && !selectedOrder && (
            <div className="bg-surface-container rounded-xl border border-outline-variant p-8 text-center flex flex-col items-center justify-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-title-sm text-lg font-bold text-on-surface mb-1">
                  Orden no encontrada
                </h3>
                <p className="font-body-sm text-on-surface-variant max-w-md">
                  No encontramos ninguna orden de servicio asociada a{' '}
                  <span className="font-semibold text-primary">"{trackingCodeParam}"</span>.
                  Verifica el código o tu número de documento e intenta nuevamente.
                </p>
              </div>
            </div>
          )}

          {/* Pestañas si hay múltiples órdenes asociadas al DNI */}
          {!loading && orders.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {orders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`px-4 py-2 rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors border ${
                    selectedOrder?.id === ord.id
                      ? 'bg-primary text-on-primary border-primary font-bold'
                      : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {ord.tracking_code} ({ord.device_info || 'Equipo'})
                </button>
              ))}
            </div>
          )}

          {/* Tarjeta Principal de Orden */}
          {!loading && selectedOrder && (
            <>
              <div className="bg-surface-container rounded-xl border border-outline-variant p-6 shadow-md relative overflow-hidden">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant/50 relative z-10">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase font-semibold">
                      CÓDIGO DE SEGUIMIENTO
                    </p>
                    <p className="font-mono-data text-mono-data text-primary text-xl font-bold">
                      {selectedOrder.tracking_code}
                    </p>
                    {selectedOrder.customer_name && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Cliente: {selectedOrder.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full border font-label-caps text-label-caps font-bold shadow-sm ${badgeInfo.bg}`}
                    >
                      {badgeInfo.label}
                    </span>
                  </div>
                </div>

                {/* Stepper de Proceso B2C */}
                {currentStep >= 0 && (
                  <div className="relative z-10 py-4 mb-6">
                    <div className="flex justify-between items-center w-full relative">
                      {/* Línea de Conexión Fondo */}
                      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0" />
                      {/* Línea Activa */}
                      <div
                        className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500 shadow-[0_0_5px_rgba(210,187,255,0.5)]"
                        style={{
                          width: `${(Math.min(currentStep, 3) / 3) * 100}%`,
                        }}
                      />

                      {/* Paso 1: Recibido */}
                      <div className="flex flex-col items-center z-10 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            currentStep >= 0
                              ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(210,187,255,0.3)]'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span
                          className={`font-label-caps text-label-caps ${
                            currentStep >= 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          Recibido
                        </span>
                      </div>

                      {/* Paso 2: En Diagnóstico / Reparación */}
                      <div className="flex flex-col items-center z-10 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            currentStep >= 1
                              ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(210,187,255,0.3)]'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>
                        <span
                          className={`font-label-caps text-label-caps ${
                            currentStep >= 1 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          Reparación
                        </span>
                      </div>

                      {/* Paso 3: Para Entregar */}
                      <div className="flex flex-col items-center z-10 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            currentStep >= 2
                              ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(210,187,255,0.3)]'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                        </div>
                        <span
                          className={`font-label-caps text-label-caps ${
                            currentStep >= 2 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          Para Entregar
                        </span>
                      </div>

                      {/* Paso 4: Entregado */}
                      <div className="flex flex-col items-center z-10 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            currentStep >= 3
                              ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(210,187,255,0.3)]'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <span
                          className={`font-label-caps text-label-caps ${
                            currentStep >= 3 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          Entregado
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje de Estado Actual */}
                <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant flex items-start gap-4">
                  <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-title-sm text-title-sm text-on-surface font-bold mb-1">
                      Detalle del Avance
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {getStatusDescription(selectedOrder.status)}
                    </p>
                  </div>
                </div>

                {/* Tarjeta de Garantía Otorgada */}
                {selectedOrder.warranty_period && (
                  <div className="mt-4 bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-title-sm text-title-sm text-emerald-400 font-bold">
                          Garantía de Servicio Técnico
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          {selectedOrder.warranty_period}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Tu reparación cuenta con cobertura oficial de garantía sobre la mano de obra y repuestos aplicados.
                      </p>
                      {selectedOrder.warranty_until && (
                        <p className="font-mono text-xs text-emerald-300 font-bold mt-2 pt-2 border-t border-emerald-500/20">
                          Válida hasta: {new Date(selectedOrder.warranty_until).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Banner Destacado de Presupuesto / Precio de Reparación */}
                {Boolean(selectedOrder.final_price && Number(selectedOrder.final_price) > 0) ? (
                  <div className="mt-4 bg-gradient-to-r from-emerald-950/40 via-surface-container-high to-emerald-950/20 rounded-xl p-5 border border-emerald-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <DollarSign className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="font-label-caps text-[11px] text-emerald-400 uppercase font-extrabold tracking-wider block">
                          {selectedOrder.status === 'entregado' ? 'Total Abonado' : 'Presupuesto de la Reparación'}
                        </span>
                        <p className="text-xs text-on-surface-variant">
                          {selectedOrder.status === 'entregado'
                            ? 'Equipo retirado y cobrado satisfactoriamente.'
                            : selectedOrder.status === 'para_entregar'
                            ? 'Equipo reparado. Importe final a abonar al momento del retiro.'
                            : 'Presupuesto asignado por el técnico para la reparación de tu equipo.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/20">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block">
                        Importe Total
                      </span>
                      <span className="font-mono-data text-3xl font-black text-emerald-400 tracking-tight">
                        ${Number(selectedOrder.final_price).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-surface-container-high rounded-xl p-4 border border-outline-variant flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-on-surface-variant" />
                      <div>
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold block">
                          Presupuesto
                        </span>
                        <span className="text-on-surface-variant text-xs">
                          En evaluación / Diagnóstico técnico pendiente de cotización
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detalles e Información de Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-on-surface mb-2">
                    <Smartphone className="w-5 h-5 text-tertiary" />
                    <h3 className="font-title-sm text-title-sm font-bold">
                      Dispositivo y Diagnóstico
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                        EQUIPO REGISTRADO
                      </p>
                      <p className="font-body-md text-body-md text-on-surface font-semibold">
                        {selectedOrder.device_info || 'Equipo técnico'}
                      </p>
                    </div>
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                        FALLA REPORTADA
                      </p>
                      <p className="font-body-md text-body-md text-on-surface bg-surface-container-highest p-2.5 rounded border border-outline-variant/50 inline-block mt-1">
                        {selectedOrder.reported_fault || 'No especificada'}
                      </p>
                    </div>
                    {selectedOrder.technical_diagnosis && (
                      <div>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                          DIAGNÓSTICO TÉCNICO
                        </p>
                        <p className="font-body-md text-body-md text-on-surface bg-surface-container-highest p-2.5 rounded border border-outline-variant/50 inline-block mt-1">
                          {selectedOrder.technical_diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-on-surface mb-4">
                      <Calendar className="w-5 h-5 text-secondary" />
                      <h3 className="font-title-sm text-title-sm font-bold">
                        Presupuesto y Estimación
                      </h3>
                    </div>
                    <div className="bg-surface p-4 rounded-lg border border-outline-variant flex flex-col items-center justify-center text-center gap-2">
                      {selectedOrder.estimated_completion ? (
                        <>
                          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                            FECHA ESTIMADA
                          </p>
                          <p className="font-title-sm text-title-sm text-primary text-xl font-bold">
                            {new Date(selectedOrder.estimated_completion).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </>
                      ) : (
                        <p className="font-body-sm text-on-surface-variant">
                          Fecha de entrega en evaluación técnica
                        </p>
                      )}

                      {Boolean(selectedOrder.final_price && Number(selectedOrder.final_price) > 0) ? (
                        <div className="mt-2 pt-2 border-t border-outline-variant w-full">
                          <p className="font-label-caps text-label-caps text-emerald-400 uppercase font-bold">
                            PRESUPUESTO
                          </p>
                          <p className="font-mono-data text-2xl text-emerald-400 font-black">
                            ${Number(selectedOrder.final_price).toLocaleString('es-AR')}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-outline-variant w-full">
                          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">
                            PRESUPUESTO
                          </p>
                          <p className="text-xs text-on-surface-variant italic">
                            Pendiente de cotización
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón WhatsApp Directo */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg font-title-sm text-title-sm transition-colors shadow-sm font-bold"
                  >
                    <MessageSquare className="w-5 h-5" /> Consultar por WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="py-6 border-t border-outline-variant text-center text-on-surface-variant font-body-sm text-body-sm">
        <p>© 2026 {shopName}. Sistema de Precisión Técnica.</p>
      </footer>
    </div>
  );
}

