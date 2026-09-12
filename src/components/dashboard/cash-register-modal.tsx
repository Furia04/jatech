'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  Printer,
  Download,
  Calendar,
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Receipt,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { ServiceOrder, Shop } from '@/types';

export interface CashMovement {
  id: string;
  orderId: string;
  trackingCode: string;
  customerName: string;
  deviceInfo: string;
  type: 'seña' | 'cobro_final';
  concept: string;
  paymentMethod: string;
  amount: number;
  date: string;
}

interface CashRegisterModalProps {
  isOpen?: boolean;
  orders: ServiceOrder[];
  shop?: Shop | null;
  onClose: () => void;
}

export function CashRegisterModal({ isOpen = true, orders, shop, onClose }: CashRegisterModalProps) {
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMethod, setFilterMethod] = useState<string>('all');

  const shopName = shop?.name || 'JaTech Servicio Técnico';

  // Extraer todos los movimientos de caja reales desde las órdenes
  const allMovements = useMemo(() => {
    const list: CashMovement[] = [];

    orders.forEach((ord) => {
      const createdAt = ord.created_at || new Date().toISOString();
      const deliveredAt = ord.delivered_at || ord.updated_at || createdAt;
      const method = (ord.payment_method || 'efectivo').toLowerCase();
      const advance = Number(ord.advance_payment) || 0;
      const finalPrice = Number(ord.final_price) || 0;

      // 1. Movimiento por Seña / Anticipo al ingreso del equipo
      if (advance > 0) {
        list.push({
          id: `mov-adv-${ord.id}`,
          orderId: ord.id,
          trackingCode: ord.tracking_code,
          customerName: ord.customer_name || 'Cliente',
          deviceInfo: ord.device_info || 'Equipo',
          type: 'seña',
          concept: `Seña / Anticipo Ingreso (${ord.tracking_code})`,
          paymentMethod: method,
          amount: advance,
          date: createdAt,
        });
      }

      // 2. Movimiento por Cobro Final al entregar el equipo
      if (ord.status === 'entregado') {
        const remaining = Math.max(0, finalPrice - advance);
        if (remaining > 0 || advance === 0) {
          const finalAmount = advance === 0 ? finalPrice : remaining;
          list.push({
            id: `mov-final-${ord.id}`,
            orderId: ord.id,
            trackingCode: ord.tracking_code,
            customerName: ord.customer_name || 'Cliente',
            deviceInfo: ord.device_info || 'Equipo',
            type: 'cobro_final',
            concept: `Liquidación Final Retiro (${ord.tracking_code})`,
            paymentMethod: method,
            amount: finalAmount,
            date: deliveredAt,
          });
        }
      }
    });

    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  // Filtrar movimientos según el período seleccionado
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allMovements.filter((mov) => {
      const movDate = new Date(mov.date);
      const movDateStr = mov.date.split('T')[0];

      let matchesPeriod = true;
      if (filterPeriod === 'today') {
        matchesPeriod = movDateStr === todayStr || movDateStr === customDate;
      } else if (filterPeriod === 'yesterday') {
        matchesPeriod = movDateStr === yesterdayStr;
      } else if (filterPeriod === 'week') {
        matchesPeriod = movDate >= sevenDaysAgo;
      } else if (filterPeriod === 'month') {
        matchesPeriod = movDate >= firstDayOfMonth;
      }

      let matchesMethod = true;
      if (filterMethod !== 'all') {
        matchesMethod = mov.paymentMethod.toLowerCase().includes(filterMethod.toLowerCase());
      }

      return matchesPeriod && matchesMethod;
    });
  }, [allMovements, filterPeriod, customDate, filterMethod]);

  // Totales por Método de Pago
  const summaryByMethod = useMemo(() => {
    const totals: Record<string, { total: number; count: number }> = {
      efectivo: { total: 0, count: 0 },
      transferencia: { total: 0, count: 0 },
      mercadopago: { total: 0, count: 0 },
      tarjeta: { total: 0, count: 0 },
      otros: { total: 0, count: 0 },
    };

    let totalGeneral = 0;
    let totalSeñas = 0;
    let totalCobrosFinales = 0;

    filteredMovements.forEach((mov) => {
      const amt = mov.amount;
      totalGeneral += amt;

      if (mov.type === 'seña') totalSeñas += amt;
      if (mov.type === 'cobro_final') totalCobrosFinales += amt;

      const m = mov.paymentMethod.toLowerCase();
      if (m.includes('efectivo')) {
        totals.efectivo.total += amt;
        totals.efectivo.count += 1;
      } else if (m.includes('transfer')) {
        totals.transferencia.total += amt;
        totals.transferencia.count += 1;
      } else if (m.includes('mercado') || m.includes('mp')) {
        totals.mercadopago.total += amt;
        totals.mercadopago.count += 1;
      } else if (m.includes('tarjeta') || m.includes('debito') || m.includes('credito')) {
        totals.tarjeta.total += amt;
        totals.tarjeta.count += 1;
      } else {
        totals.otros.total += amt;
        totals.otros.count += 1;
      }
    });

    return { totals, totalGeneral, totalSeñas, totalCobrosFinales };
  }, [filteredMovements]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['Fecha y Hora', 'Orden', 'Cliente', 'Dispositivo', 'Tipo', 'Método de Pago', 'Monto (ARS)'];
    const rows = filteredMovements.map((m) => [
      new Date(m.date).toLocaleString('es-AR'),
      m.trackingCode,
      `"${m.customerName}"`,
      `"${m.deviceInfo}"`,
      m.type === 'seña' ? 'Seña / Anticipo' : 'Cobro Final Retiro',
      m.paymentMethod.toUpperCase(),
      m.amount.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cierre_caja_${filterPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-[#0f131a] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Encabezado del Modal */}
        <div className="p-4 sm:p-5 bg-[#141923] border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
                ARQUEO DE MOSTRADOR & AUDITORÍA
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Cierre de Caja Diario <span className="text-slate-400 text-xs font-normal">({shopName})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrintZReport}
              className="px-3 py-2 bg-[#1b2230] hover:bg-[#232c3d] border border-white/10 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Imprimir Comanda Z de Cierre de Caja (80mm)"
            >
              <Printer className="w-3.5 h-3.5 text-primary" /> Ticket Z (80mm)
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-[#1b2230] hover:bg-[#232c3d] border border-white/10 text-emerald-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Descargar archivo Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros de Período y Métodos */}
        <div className="p-4 bg-[#111620] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-[#0b0e14] p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterPeriod === 'today'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilterPeriod('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterPeriod === 'yesterday'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterPeriod === 'week'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterPeriod === 'month'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterPeriod === 'all'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todo el Histórico
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-[#0b0e14] border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los Métodos</option>
              <option value="efectivo">💵 Solo Efectivo</option>
              <option value="transferencia">🏦 Solo Transferencias</option>
              <option value="mercadopago">📱 Solo Mercado Pago</option>
              <option value="tarjeta">💳 Solo Tarjetas</option>
            </select>
          </div>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TARJETAS BENTO DE RESUMEN FINANCIERO */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#141923] border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-mono">
                <span>EFECTIVO EN CAJA</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-2">
                ${summaryByMethod.totals.efectivo.total.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {summaryByMethod.totals.efectivo.count} cobros físicos
              </div>
            </div>

            <div className="bg-[#141923] border border-blue-500/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-mono">
                <span>TRANSFERENCIAS</span>
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-2">
                ${summaryByMethod.totals.transferencia.total.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                {summaryByMethod.totals.transferencia.count} comprobantes
              </div>
            </div>

            <div className="bg-[#141923] border border-sky-500/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-mono">
                <span>MERCADO PAGO</span>
                <Smartphone className="w-4 h-4 text-sky-400" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-2">
                ${summaryByMethod.totals.mercadopago.total.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                {summaryByMethod.totals.mercadopago.count} cobros digitales
              </div>
            </div>

            <div className="bg-[#141923] border border-purple-500/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-mono">
                <span>TARJETAS D/C</span>
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-2">
                ${summaryByMethod.totals.tarjeta.total.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                {summaryByMethod.totals.tarjeta.count} cupones
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-950/60 to-[#141923] border border-emerald-500/50 rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-emerald-300 text-[11px] font-mono font-bold">
                <span>TOTAL ARQUEO</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2">
                ${summaryByMethod.totalGeneral.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                {filteredMovements.length} transacciones
              </div>
            </div>
          </div>

          {/* TABLA DE MOVIMIENTOS DETALLADOS */}
          <div className="bg-[#141923] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-[#181e2b]">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" /> Libro Diario de Entradas ({filteredMovements.length})
              </h4>
              <span className="font-mono text-[11px] text-slate-400">
                Señas: ${summaryByMethod.totalSeñas.toLocaleString('es-AR')} • Retiros: ${summaryByMethod.totalCobrosFinales.toLocaleString('es-AR')}
              </span>
            </div>

            {filteredMovements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No hay movimientos de dinero registrados en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0b0e14] border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3">Orden</th>
                      <th className="p-3">Cliente / Dispositivo</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Método</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(mov.date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 font-bold text-primary">{mov.trackingCode}</td>
                        <td className="p-3">
                          <div className="font-bold text-white font-sans">{mov.customerName}</div>
                          <div className="text-[10px] text-slate-400">{mov.deviceInfo}</div>
                        </td>
                        <td className="p-3">
                          {mov.type === 'seña' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              Seña / Anticipo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                              Liquidación Retiro
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] text-slate-300 uppercase font-semibold">
                            {mov.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                          +${mov.amount.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141923] border-t border-white/10 flex justify-between items-center text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            JaTech Workbench • Cierre verificado con Supabase Multi-Tenant
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* PLANTILLA DE IMPRESIÓN EXCLUSIVA TICKET Z DE 80MM */}
      <div className="hidden print:block print:w-[80mm] print:p-3 print:m-0 print:bg-white print:text-black font-mono text-[10px] leading-tight">
        <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
          <h1 className="font-bold text-sm uppercase">CIERRE DE CAJA (Z-REPORT)</h1>
          <p className="font-bold text-xs">{shopName}</p>
          <p className="text-[9px]">FECHA: {new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR')}</p>
          <p className="text-[9px]">PERÍODO: {filterPeriod.toUpperCase()}</p>
        </div>

        <div className="py-2 mb-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span>EFECTIVO:</span>
            <span className="font-bold">${summaryByMethod.totals.efectivo.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TRANSFERENCIA:</span>
            <span className="font-bold">${summaryByMethod.totals.transferencia.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>MERCADO PAGO:</span>
            <span className="font-bold">${summaryByMethod.totals.mercadopago.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TARJETAS D/C:</span>
            <span className="font-bold">${summaryByMethod.totals.tarjeta.total.toFixed(2)}</span>
          </div>
          {summaryByMethod.totals.otros.total > 0 && (
            <div className="flex justify-between">
              <span>OTROS:</span>
              <span className="font-bold">${summaryByMethod.totals.otros.total.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="py-2 mb-2 border-b-2 border-black space-y-1">
          <div className="flex justify-between text-xs font-extrabold">
            <span>TOTAL EN CAJA:</span>
            <span>${summaryByMethod.totalGeneral.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span>(Señas: ${summaryByMethod.totalSeñas.toFixed(2)} / Retiros: ${summaryByMethod.totalCobrosFinales.toFixed(2)})</span>
          </div>
        </div>

        <div className="space-y-1 text-[9px] pb-2 mb-2 border-b border-dashed border-black">
          <div className="font-bold mb-1">DETALLE ({filteredMovements.length} transacciones):</div>
          {filteredMovements.slice(0, 30).map((m, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{m.trackingCode} - {m.type === 'seña' ? 'Seña' : 'Retiro'} ({m.paymentMethod.slice(0, 4)}):</span>
              <span>${m.amount.toFixed(2)}</span>
            </div>
          ))}
          {filteredMovements.length > 30 && (
            <div className="text-center italic text-[8px]">+ {filteredMovements.length - 30} movimientos más...</div>
          )}
        </div>

        <div className="text-center text-[8px] pt-1">
          <p>Auditoría de Mostrador - JaTech</p>
        </div>
      </div>
    </div>
  );
}
