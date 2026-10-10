'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  AlertTriangle,
  Check,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { MarketProduct, StockMovementType } from '@/types/market';
import { adjustMarketProductStock } from '@/lib/supabase/market-services';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  product: MarketProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

type AdjustmentMode = 'count' | 'purchase' | 'waste' | 'direct';

export function StockAdjustmentModal({
  isOpen,
  product,
  onClose,
  onSaved,
}: StockAdjustmentModalProps) {
  const [mode, setMode] = useState<AdjustmentMode>('count');
  const [inputValue, setInputValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !product) return;

    setErrorMsg(null);
    setMode('count');
    setInputValue(product.stock.toString());
    setReason('');
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock) || 0;
  const numInput = parseFloat(inputValue) || 0;

  // Calcular el nuevo stock según el modo seleccionado
  let calculatedNewStock = currentStock;
  let movementType: StockMovementType = 'adjustment';
  let deltaQuantity = 0;

  if (mode === 'count') {
    calculatedNewStock = numInput;
    movementType = 'adjustment';
    deltaQuantity = calculatedNewStock - currentStock;
  } else if (mode === 'purchase') {
    calculatedNewStock = currentStock + Math.max(0, numInput);
    movementType = 'purchase';
    deltaQuantity = Math.max(0, numInput);
  } else if (mode === 'waste') {
    calculatedNewStock = currentStock - Math.max(0, numInput);
    movementType = 'waste';
    deltaQuantity = -Math.max(0, numInput);
  } else if (mode === 'direct') {
    calculatedNewStock = numInput;
    movementType = 'adjustment';
    deltaQuantity = calculatedNewStock - currentStock;
  }

  const quickReasons: Record<AdjustmentMode, string[]> = {
    count: [
      'Conteo físico periódico de góndola',
      'Auditoría mensual de inventario',
      'Corrección por recuento en depósito',
    ],
    purchase: [
      'Recepción de pedido de proveedor',
      'Ingreso extraordinario de mercadería',
      'Devolución de cliente',
    ],
    waste: [
      'Rotura accidental en local',
      'Vencimiento de producto',
      'Merma por descomposición / envase roto',
    ],
    direct: [
      'Ajuste general de existencias',
      'Corrección de stock inicial',
    ],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setErrorMsg(null);

    if (!reason.trim()) {
      setErrorMsg('Debes especificar un motivo o justificación para registrar el movimiento.');
      return;
    }

    if (isNaN(calculatedNewStock)) {
      setErrorMsg('La cantidad ingresada no es un número válido.');
      return;
    }

    setSaving(true);
    try {
      await adjustMarketProductStock(
        product.id,
        calculatedNewStock,
        movementType,
        reason.trim()
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error al ajustar stock:', err);
      setErrorMsg(err.message || 'Error al actualizar el stock');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ajustar Existencias de Stock</h2>
              <p className="text-xs text-slate-400">
                {product.name} — <span className="font-mono text-slate-300">{product.barcode}</span>
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

        {/* Resumen de Stock Actual */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Stock Actual en Sistema</span>
            <span className="text-base font-bold font-mono text-white">
              {currentStock.toLocaleString('es-AR', { maximumFractionDigits: product.is_weighable ? 3 : 0 })}{' '}
              <span className="text-xs font-normal text-slate-400 uppercase">{product.unit_type}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Umbral Mínimo Alerta</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {product.min_stock} {product.unit_type}
            </span>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Selector de Modos de Ajuste */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tipo de Movimiento / Operación
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('count');
                  setInputValue(currentStock.toString());
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mode === 'count'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Conteo Físico</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('purchase');
                  setInputValue('');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mode === 'purchase'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Ingreso Compra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('waste');
                  setInputValue('');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mode === 'waste'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Merma / Rotura</span>
              </button>
            </div>
          </div>

          {/* Input de Cantidad */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {mode === 'count' && 'Cantidad Contada en Local / Góndola'}
              {mode === 'purchase' && 'Cantidad que Ingresa (a sumar)'}
              {mode === 'waste' && 'Cantidad de Merma o Rotura (a restar)'}
              {mode === 'direct' && 'Nuevo Stock Total'}
            </label>
            <div className="relative">
              <input
                type="number"
                step={product.is_weighable ? '0.001' : '1'}
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold rounded-xl bg-slate-950 text-white placeholder-slate-600 border border-slate-800 focus:border-emerald-500 outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs uppercase text-slate-500 font-mono font-bold">
                {product.unit_type}
              </span>
            </div>
          </div>

          {/* Panel de Diferencial y Resultado Proyectado */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Variación (Delta):</span>
              <span
                className={`font-bold text-xs ${
                  deltaQuantity > 0
                    ? 'text-emerald-400'
                    : deltaQuantity < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {deltaQuantity > 0 ? `+${deltaQuantity}` : deltaQuantity} {product.unit_type}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Nuevo Stock Resultante:</span>
              <span className="text-sm font-bold text-white">
                {calculatedNewStock.toLocaleString('es-AR', {
                  maximumFractionDigits: product.is_weighable ? 3 : 0,
                })}{' '}
                {product.unit_type}
              </span>
            </div>
          </div>

          {/* Motivo Obligatorio */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Motivo o Justificación del Movimiento *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Conteo físico mensual, reposición de proveedor..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-emerald-500 outline-none"
            />

            {/* Sugerencias de motivos rápidos */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons[mode].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(q)}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Ajuste</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
