'use client';

import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Scale, Package, AlertCircle } from 'lucide-react';
import { MarketProduct } from '@/types/market';

export interface CartItem {
  product: MarketProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
}: POSCartProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full rounded-2xl border-2 border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
      {/* Cabecera del Carrito */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Comprobante de Venta Activo</h2>
            <span className="text-xs text-slate-400 font-mono">
              {items.length} producto{items.length !== 1 ? 's' : ''} ({totalUnits.toFixed(items.some((i) => i.product.is_weighable) ? 2 : 0)} unidades/kg)
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar [Esc]</span>
          </button>
        )}
      </div>

      {/* Lista de Ítems */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
        {items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-300">Ticket en espera de productos</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Escanea el código de barras con el lector láser o presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">F2</kbd> para buscar por texto.
              </p>
            </div>
          </div>
        ) : (
          items.map((item) => {
            const isWeighable = item.product.is_weighable;
            return (
              <div
                key={item.product.id}
                className="p-3 rounded-xl hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 group"
              >
                {/* Info del Producto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white truncate">{item.product.name}</span>
                    {isWeighable ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <Scale className="w-2.5 h-2.5" />
                        Kg
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>EAN: {item.product.barcode}</span>
                    <span>•</span>
                    <span>${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u</span>
                  </div>
                </div>

                {/* Control de Cantidad */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const step = isWeighable ? 0.25 : 1;
                      const next = Math.max(isWeighable ? 0.05 : 1, item.quantity - step);
                      onUpdateQuantity(item.product.id, next);
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min={isWeighable ? '0.01' : '1'}
                    step={isWeighable ? '0.05' : '1'}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        onUpdateQuantity(item.product.id, val);
                      }
                    }}
                    className="w-16 py-1 px-1.5 text-center font-mono font-bold text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const step = isWeighable ? 0.25 : 1;
                      onUpdateQuantity(item.product.id, item.quantity + step);
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal del Item */}
                <div className="text-right w-24">
                  <div className="font-mono font-bold text-base text-white">
                    ${item.totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Inferior de Cobro y Totales */}
      <div className="p-4 border-t-2 border-slate-800 bg-slate-950">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-xs uppercase font-mono font-semibold tracking-wider text-slate-400 block">
              TOTAL A COBRAR
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Impuestos incluidos</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Botón Principal de Cobro F4 */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.99]"
        >
          <span>COBRAR TICKET</span>
          <span className="px-2 py-0.5 rounded bg-emerald-700/60 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-200 border border-emerald-500/30">
            [F4]
          </span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
