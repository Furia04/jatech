'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle, Check } from 'lucide-react';
import { CashMovementType } from '@/types/market';

interface CashMovementModalProps {
  isOpen: boolean;
  shiftId: string;
  onClose: () => void;
  onConfirm: (type: CashMovementType, amount: number, reason: string) => Promise<void>;
}

export function CashMovementModal({
  isOpen,
  shiftId,
  onClose,
  onConfirm,
}: CashMovementModalProps) {
  const [type, setType] = useState<CashMovementType>('income');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickReasons = {
    income: ['Aporte de cambio / cambio chico', 'Ingreso por cobranza externa', 'Reposición de fondo'],
    expense: ['Pago a repartidor / proveedor', 'Retiro parcial de seguridad', 'Gasto menor de limpieza / librería'],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Ingresa un importe mayor a $0.');
      return;
    }
    if (!reason.trim()) {
      setError('Debes especificar el motivo o justificación del movimiento.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(type, parsedAmount, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el movimiento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              type === 'income'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            {type === 'income' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Movimiento Manual de Efectivo</h2>
            <p className="text-xs text-slate-400">Registra entradas o salidas directas de la gaveta</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Tipo */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Ingreso (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Retiro (-)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Monto a {type === 'income' ? 'Ingresar' : 'Retirar'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">$</span>
              <input
                type="number"
                min="1"
                step="50"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold tracking-tight focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Motivo / Concepto Justificado
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Pago de panificados..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {/* Atajos de motivos */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons[type].map((qr) => (
                <button
                  type="button"
                  key={qr}
                  onClick={() => setReason(qr)}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/50 transition-colors text-left"
                >
                  {qr}
                </button>
              ))}
            </div>
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
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold tracking-wide flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
              }`}
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Registrar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
