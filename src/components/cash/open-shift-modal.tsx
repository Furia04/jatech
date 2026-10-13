'use client';

import React, { useState } from 'react';
import { X, Wallet, Check, AlertCircle } from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (initialCash: number, notes?: string) => Promise<void>;
}

export function OpenShiftModal({ isOpen, onClose, onConfirm }: OpenShiftModalProps) {
  const [initialCash, setInitialCash] = useState<string>('20000');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(initialCash);
    if (isNaN(amount) || amount < 0) {
      setError('Ingresa un importe válido mayor o igual a $0.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(amount, notes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al abrir el turno de caja.');
    } finally {
      setLoading(false);
    }
  }

  const quickAmounts = [10000, 20000, 30000, 50000];

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
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Apertura de Turno de Caja</h2>
            <p className="text-xs text-slate-400">Ingresa el fondo inicial para cambio en gaveta</p>
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
              Fondo Inicial de Caja (Efectivo)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">$</span>
              <input
                type="number"
                min="0"
                step="100"
                required
                autoFocus
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold tracking-tight focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="0"
              />
            </div>

            {/* Botones de sugerencias rápidas */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setInitialCash(q.toString())}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700/60 transition-colors"
                >
                  +${q.toLocaleString('es-AR')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notas u Observaciones del Turno (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Turno mañana, billetes chicos de $100 y $500..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Abriendo...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Apertura</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
