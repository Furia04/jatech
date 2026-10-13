'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Package,
  Calendar,
  Search,
  ArrowUpRight,
  Printer,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MarketSale } from '@/types/market';
import { getLocalSales, getLocalShifts, getLocalProducts } from '@/lib/market-store/local-market-adapter';
import { ThermalTicketModal } from '@/components/tickets/thermal-ticket-modal';

export default function ReportsPage() {
  const [sales, setSales] = useState<MarketSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTicket, setSearchTicket] = useState('');
  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<MarketSale | null>(null);

  useEffect(() => {
    try {
      const data = getLocalSales();
      setSales(data);
    } catch (e) {
      console.error('Error loading reports sales:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const count = sales.length;
    const avgTicket = count > 0 ? totalRevenue / count : 0;

    let units = 0;
    const paymentBreakdown: Record<string, number> = {
      efectivo: 0,
      mercado_pago: 0,
      tarjeta_debito: 0,
      tarjeta_credito: 0,
    };

    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const s of sales) {
      const method = s.payment_method || 'efectivo';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(s.total_amount);

      if (s.items) {
        for (const it of s.items) {
          units += Number(it.quantity) || 1;
          const key = it.product_id || it.product_name;
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              name: it.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          productSalesMap[key].quantity += Number(it.quantity) || 1;
          productSalesMap[key].revenue += Number(it.total_price) || 0;
        }
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      count,
      avgTicket,
      units,
      paymentBreakdown,
      topProducts,
    };
  }, [sales]);

  // Ventas filtradas por buscador de ticket
  const filteredSales = useMemo(() => {
    if (!searchTicket.trim()) return sales;
    const term = searchTicket.toLowerCase().trim();
    return sales.filter(
      (s) =>
        s.ticket_number.toLowerCase().includes(term) ||
        (s.cashier?.full_name && s.cashier.full_name.toLowerCase().includes(term))
    );
  }, [sales, searchTicket]);

  const cardsRevenue = (metrics.paymentBreakdown.tarjeta_debito || 0) + (metrics.paymentBreakdown.tarjeta_credito || 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Dashboard Analítico
              </span>
              <span className="text-xs text-slate-500 font-mono">Consolidado en Tiempo Real</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              Métricas, Ventas y Reportes
            </h1>
            <p className="text-sm text-slate-400">
              Desglose de recaudación comercial, medios de pago y productos con mayor rotación
            </p>
          </div>
        </div>

        {/* Tarjetas KPI de Desempeño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Facturación Total Acumulada
            </span>
            <div className="mt-2 text-3xl font-black font-mono text-emerald-400">
              ${metrics.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-mono">100% de tickets confirmados</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-sky-400" />
              Tickets Emitidos
            </span>
            <div className="mt-2 text-3xl font-black font-mono text-white">
              {metrics.count}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-mono">Transacciones exitosas</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ticket Promedio
            </span>
            <div className="mt-2 text-3xl font-black font-mono text-amber-400">
              ${metrics.avgTicket.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-mono">Por cliente atendido</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              Artículos Despachados
            </span>
            <div className="mt-2 text-3xl font-black font-mono text-purple-300">
              {metrics.units.toFixed(1)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-mono">Unidades / kilogramos vendidos</span>
          </div>
        </div>

        {/* Fila de Distribución de Medios de Pago y Productos Top */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Desglose de Medios de Pago (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Recaudación por Medio de Pago
            </h2>

            <div className="space-y-3 pt-1">
              {/* Efectivo */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    Efectivo
                  </span>
                  <span className="font-bold text-white">
                    ${(metrics.paymentBreakdown.efectivo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics.totalRevenue > 0 ? ((metrics.paymentBreakdown.efectivo || 0) / metrics.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Mercado Pago QR */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                    Mercado Pago QR
                  </span>
                  <span className="font-bold text-white">
                    ${(metrics.paymentBreakdown.mercado_pago || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics.totalRevenue > 0 ? ((metrics.paymentBreakdown.mercado_pago || 0) / metrics.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Tarjetas Débito / Crédito */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    Tarjetas (Débito/Crédito)
                  </span>
                  <span className="font-bold text-white">
                    ${cardsRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${metrics.totalRevenue > 0 ? (cardsRevenue / metrics.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ranking de Productos Más Vendidos (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Ranking de Productos con Mayor Facturación
            </h2>

            {metrics.topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Aún no hay suficientes ventas registradas para generar el ranking.
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.quantity.toFixed(1)} despachados
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        ${p.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Libro de Ventas Recientes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-white text-base">Libro de Tickets de Venta Emitidos</h2>
              <span className="text-xs font-mono text-slate-400">
                ({filteredSales.length} transacciones)
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder="Buscar ticket (ej: T-000001)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se registran ventas emitidas aún. Realiza cobros en el Punto de Venta (POS) para poblar este libro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-4">Fecha / Hora</th>
                    <th className="py-2.5 px-4">Cajero</th>
                    <th className="py-2.5 px-4">Artículos</th>
                    <th className="py-2.5 px-4">Medio de Pago</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-white">
                        {s.ticket_number}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {new Date(s.created_at).toLocaleDateString('es-AR')}{' '}
                        {new Date(s.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {s.cashier?.full_name || 'Cajero Principal'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-400">
                        {s.items?.length || 0} ítems
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {s.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-emerald-400 text-right">
                        ${(Number(s.total_amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForTicket(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ticket</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal de Re-impresión de Comprobante */}
      <ThermalTicketModal
        isOpen={selectedSaleForTicket !== null}
        sale={selectedSaleForTicket}
        onClose={() => setSelectedSaleForTicket(null)}
      />
    </div>
  );
}
