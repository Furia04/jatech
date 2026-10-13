'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Calculator, Sparkles } from 'lucide-react';
import { MarketCashShift } from '@/types/market';

interface CloseShiftModalProps {
  isOpen: boolean;
  shift: MarketCashShift;
  onClose: () => void;
  onConfirm: (actualCash: number, notes?: string) => Promise<void>;
}

export function CloseShiftModal({
  isOpen,
  shift,
  onClose,
  onConfirm,
}: CloseShiftModalProps) {
  const [actualCashStr, setActualCashStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedCash = Number(shift.expected_cash) || 0;
  const actualCash = Number(actualCashStr) || 0;
  const difference = actualCash - expectedCash;
  const hasEnteredAmount = actualCashStr.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasEnteredAmount) {
      setError('Debes ingresar el total de efectivo físico recontado.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(actualCash, notes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el cierre de caja.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Arqueo y Cierre Z de Caja</h2>
            <p className="text-xs text-slate-400">Auditoría de gaveta y balance final del turno</p>
          </div>
        </div>

        {/* Resumen del Sistema */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-5">
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Fondo Inicial</span>
            <span className="text-sm font-mono font-semibold text-slate-200">
              ${(Number(shift.initial_cash) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Ventas Registradas</span>
            <span className="text-sm font-mono font-semibold text-emerald-400">
              ${(Number(shift.total_sales_amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Efectivo Teórico Esperado:</span>
            <span className="text-base font-mono font-bold text-white">
              ${expectedCash.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Efectivo Físico Recontado en Gaveta
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">$</span>
              <input
                type="number"
                min="0"
                step="10"
                required
                autoFocus
                value={actualCashStr}
                onChange={(e) => setActualCashStr(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold tracking-tight focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Comparativa Dinámica de Discrepancia */}
          {hasEnteredAmount && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                difference === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : difference > 0
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                {difference === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>¡Caja Cuadrada Perfecta!</span>
                  </>
                ) : difference > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Sobrante de Caja:</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Faltante de Caja:</span>
                  </>
                )}
              </div>
              <span className="font-mono text-base font-bold">
                {difference > 0 ? `+` : ''}
                ${difference.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observaciones de Cierre (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Justificación de diferencias o estado final del puesto..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !hasEnteredAmount}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold tracking-wide flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Cerrando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Cierre Z</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
