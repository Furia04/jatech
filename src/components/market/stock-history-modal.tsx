'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  User,
  Clock,
  Filter,
  Package,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { MarketStockMovement, StockMovementType } from '@/types/market';
import { fetchMarketStockMovements } from '@/lib/supabase/market-services';

interface StockHistoryModalProps {
  isOpen: boolean;
  productId?: string;
  productName?: string;
  onClose: () => void;
}

export function StockHistoryModal({
  isOpen,
  productId,
  productName,
  onClose,
}: StockHistoryModalProps) {
  const [movements, setMovements] = useState<MarketStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  async function loadMovements() {
    if (!isOpen) return;
    setLoading(true);
    try {
      const typeFilter = selectedType !== 'all' ? (selectedType as StockMovementType) : undefined;
      const data = await fetchMarketStockMovements({
        productId,
        type: typeFilter,
        limit: 150,
      });
      setMovements(data);
    } catch (err) {
      console.error('Error cargando historial de stock:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, [isOpen, productId, selectedType]);

  if (!isOpen) return null;

  function getTypeBadge(type: StockMovementType) {
    switch (type) {
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>Compra / Ingreso</span>
          </span>
        );
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Package className="w-3 h-3" />
            <span>Venta POS</span>
          </span>
        );
      case 'waste':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-3 h-3" />
            <span>Merma / Rotura</span>
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-3 h-3" />
            <span>Ajuste Conteo</span>
          </span>
        );
      case 'cancellation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Anulación</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 font-semibold">
            {type}
          </span>
        );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {productName ? `Auditoría de Movimientos: ${productName}` : 'Historial General de Movimientos'}
              </h2>
              <p className="text-xs text-slate-400">
                Trazabilidad inmutable de entradas, salidas, ventas y ajustes de stock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filtrar por tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 focus:border-emerald-500 outline-none text-xs"
            >
              <option value="all">Todos los movimientos</option>
              <option value="purchase">Compras / Ingresos</option>
              <option value="sale">Ventas POS</option>
              <option value="waste">Mermas y Roturas</option>
              <option value="adjustment">Ajustes por Conteo</option>
              <option value="cancellation">Anulaciones</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              {movements.length} movimientos encontrados
            </span>
            <button
              onClick={loadMovements}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title="Refrescar movimientos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabla o Lista de Movimientos */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
              <span>Cargando movimientos de inventario...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No se encontraron movimientos</p>
              <p className="text-xs text-slate-500 mt-1">
                Los ajustes manuales y las ventas del punto de venta quedarán auditados aquí.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    {!productId && <th className="py-2.5 px-3">Producto</th>}
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Variación</th>
                    <th className="py-2.5 px-3 text-right">Stock Anterior → Nuevo</th>
                    <th className="py-2.5 px-3">Motivo / Justificación</th>
                    <th className="py-2.5 px-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                  {movements.map((mov) => {
                    const dateFormatted = new Date(mov.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isPositive = mov.new_stock > mov.previous_stock;
                    const isNegative = mov.new_stock < mov.previous_stock;

                    return (
                      <tr key={mov.id} className="hover:bg-slate-900/40 transition-colors">
                        {/* Fecha */}
                        <td className="py-2.5 px-3 text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                          <span>{dateFormatted}</span>
                        </td>

                        {/* Producto si es vista global */}
                        {!productId && (
                          <td className="py-2.5 px-3 font-sans text-white font-medium max-w-[180px] truncate">
                            {mov.product?.name || 'Producto eliminado'}
                          </td>
                        )}

                        {/* Tipo de movimiento */}
                        <td className="py-2.5 px-3">
                          {getTypeBadge(mov.type)}
                        </td>

                        {/* Variación */}
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {isPositive ? `+${mov.quantity}` : isNegative ? `-${mov.quantity}` : mov.quantity}
                          </span>
                        </td>

                        {/* Stock Anterior -> Nuevo */}
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          <span>{mov.previous_stock}</span>
                          <span className="mx-1 text-slate-600">→</span>
                          <span className="text-white font-bold">{mov.new_stock}</span>
                        </td>

                        {/* Motivo */}
                        <td className="py-2.5 px-3 font-sans text-slate-300 max-w-[220px] truncate" title={mov.reason || ''}>
                          {mov.reason || '—'}
                        </td>

                        {/* Operador */}
                        <td className="py-2.5 px-3 font-sans text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {mov.user?.full_name || mov.user?.email || 'Sistema'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
