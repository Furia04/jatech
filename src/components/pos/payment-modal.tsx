'use client';

import React, { useState } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { MarketPaymentMethod } from '@/types/market';
import { MPQRSimulator } from './mp-qr-simulator';

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirmPayment: (
    method: MarketPaymentMethod,
    amountPaid: number,
    changeReturned: number,
    paymentDetails?: Record<string, any>
  ) => Promise<void>;
}

export function PaymentModal({
  isOpen,
  totalAmount,
  onClose,
  onConfirmPayment,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<MarketPaymentMethod>('efectivo');
  const [amountPaidStr, setAmountPaidStr] = useState<string>(totalAmount.toString());
  const [cardVoucher, setCardVoucher] = useState<string>('');
  const [cardType, setCardType] = useState<'debito' | 'credito'>('debito');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const amountPaid = Number(amountPaidStr) || 0;
  const changeReturned = Math.max(0, amountPaid - totalAmount);
  const isCashSufficient = amountPaid >= totalAmount;

  // Billetes rápidos comunes
  const quickBills = [1000, 2000, 5000, 10000, 20000];

  async function handleCashConfirm() {
    if (!isCashSufficient) {
      setError(`El importe entregado ($${amountPaid}) es menor al total a pagar ($${totalAmount}).`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirmPayment('efectivo', amountPaid, changeReturned, {
        cash_tendered: amountPaid,
        change: changeReturned,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error procesando cobro en efectivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleCardConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirmPayment(cardType === 'debito' ? 'tarjeta_debito' : 'tarjeta_credito', totalAmount, 0, {
        card_type: cardType,
        voucher_number: cardVoucher.trim() || `POS-${Date.now().toString().slice(-4)}`,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error procesando cobro con tarjeta');
    } finally {
      setLoading(false);
    }
  }

  async function handleMPSuccess(details: Record<string, any>) {
    setLoading(true);
    setError(null);
    try {
      await onConfirmPayment('mercadopago_qr', totalAmount, 0, details);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error registrando cobro con Mercado Pago');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Resumen Superior */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total de la Venta</span>
            <div className="text-3xl font-black font-mono text-emerald-400">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Paso Final de Cobro
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pestañas de Métodos de Pago */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setSelectedMethod('efectivo')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedMethod === 'efectivo'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Efectivo</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('tarjeta_debito')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedMethod === 'tarjeta_debito' || selectedMethod === 'tarjeta_credito'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarjeta Déb/Créd</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('mercadopago_qr')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedMethod === 'mercadopago_qr'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mercado Pago QR</span>
          </button>
        </div>

        {/* Vista: EFECTIVO */}
        {selectedMethod === 'efectivo' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Dinero Entregado por Cliente</label>
                <button
                  type="button"
                  onClick={() => setAmountPaidStr(totalAmount.toString())}
                  className="text-[11px] font-mono text-emerald-400 hover:underline"
                >
                  Monto Exacto
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  autoFocus
                  value={amountPaidStr}
                  onChange={(e) => setAmountPaidStr(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-2xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Botones rápidos de billetes */}
              <div className="flex flex-wrap gap-2 mt-2">
                {quickBills.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      const cur = Number(amountPaidStr) || 0;
                      setAmountPaidStr((cur + b).toString());
                    }}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition-colors"
                  >
                    +${b.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>
            </div>

            {/* Cálculo de Vuelto / Cambio */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                isCashSufficient
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-mono font-semibold tracking-wider block">
                  {isCashSufficient ? 'Vuelto / Cambio a Entregar' : 'Faltan para cubrir'}
                </span>
                <span className="text-xs font-mono opacity-80">
                  {isCashSufficient ? 'Entregar en efectivo' : 'Monto insuficiente'}
                </span>
              </div>
              <div className="font-mono text-2xl font-black">
                ${(isCashSufficient ? changeReturned : totalAmount - amountPaid).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !isCashSufficient}
                onClick={handleCashConfirm}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Pago Efectivo</span>
              </button>
            </div>
          </div>
        )}

        {/* Vista: TARJETA */}
        {(selectedMethod === 'tarjeta_debito' || selectedMethod === 'tarjeta_credito') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardType('debito')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  cardType === 'debito'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Tarjeta de Débito
              </button>
              <button
                type="button"
                onClick={() => setCardType('credito')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  cardType === 'credito'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Tarjeta de Crédito (1 Pago)
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                N° de Cupón / Referencia Posnet (Opcional)
              </label>
              <input
                type="text"
                value={cardVoucher}
                onChange={(e) => setCardVoucher(e.target.value)}
                placeholder="Ej: 048293"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCardConfirm}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Pago Tarjeta</span>
              </button>
            </div>
          </div>
        )}

        {/* Vista: MERCADO PAGO QR */}
        {selectedMethod === 'mercadopago_qr' && (
          <MPQRSimulator amount={totalAmount} onPaymentSuccess={handleMPSuccess} />
        )}
      </div>
    </div>
  );
}
