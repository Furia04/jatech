'use client';

import React, { useState } from 'react';
import { X, Printer, Download, Check, Sparkles, Store, CheckCircle2 } from 'lucide-react';
import { MarketSale } from '@/types/market';

interface ThermalTicketModalProps {
  isOpen: boolean;
  sale: MarketSale | null;
  onClose: () => void;
}

export function ThermalTicketModal({
  isOpen,
  sale,
  onClose,
}: ThermalTicketModalProps) {
  const [ticketWidth, setTicketWidth] = useState<'58mm' | '80mm'>('80mm');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sale) return null;

  function handlePrint() {
    window.print();
  }

  function handleCopySummary() {
    if (!sale) return;
    const lines = [
      `=== JATECH MARKET - TICKET ${sale.ticket_number} ===`,
      `Fecha: ${new Date(sale.created_at).toLocaleString('es-AR')}`,
      `Total: $${Number(sale.total_amount).toFixed(2)}`,
      `Medio de Pago: ${sale.payment_method.toUpperCase()}`,
      `Items:`,
      ...(sale.items?.map((i) => ` - ${i.quantity}x ${i.product_name}: $${Number(i.total_price).toFixed(2)}`) || []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Barra superior de control */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              VENTA REGISTRADA
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTicketWidth('58mm')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  ticketWidth === '58mm' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setTicketWidth('80mm')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  ticketWidth === '80mm' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenedor del Ticket Térmico con textura y proporciones reales */}
        <div className="flex-1 overflow-y-auto py-4 flex justify-center">
          <div
            id="thermal-receipt"
            className={`thermal-receipt-printable bg-white text-black font-mono shadow-2xl p-4 transition-all duration-200 select-text rounded-sm ${
              ticketWidth === '58mm' ? 'w-[240px] text-[10px]' : 'w-[320px] text-[12px]'
            }`}
            style={{ fontFamily: 'Courier New, Courier, monospace' }}
          >
            {/* Cabecera del Comercio */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <div className="font-bold text-sm tracking-widest uppercase">JATECH MARKET</div>
              <div className="text-[10px]">MINIMARKET & SUPERMERCADO</div>
              <div className="text-[9px]">Av. Rivadavia 4520 - CABA</div>
              <div className="text-[9px]">CUIT: 30-71649281-9</div>
              <div className="text-[9px]">IVA RESPONSABLE INSCRIPTO</div>
            </div>

            {/* Datos del Ticket */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>TICKET NRO:</span>
                <span>{sale.ticket_number}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>FECHA:</span>
                <span>{new Date(sale.created_at).toLocaleDateString('es-AR')} {new Date(sale.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>CAJERO:</span>
                <span>{sale.cashier?.full_name || 'Caja 01'}</span>
              </div>
            </div>

            {/* Listado de Ítems */}
            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-black">
                <span className="w-1/2">DETALLE</span>
                <span className="w-1/4 text-center">CANT</span>
                <span className="w-1/4 text-right">TOTAL</span>
              </div>

              {sale.items && sale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[10px] leading-tight">
                  <div className="w-1/2 truncate font-semibold">{it.product_name}</div>
                  <div className="w-1/4 text-center">
                    {it.quantity} x ${(it.unit_price || 0).toFixed(0)}
                  </div>
                  <div className="w-1/4 text-right font-bold">
                    ${(it.total_price || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totales y Medio de Pago */}
            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-black text-sm pt-1">
                <span>TOTAL:</span>
                <span>${(Number(sale.total_amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-[10px] pt-1 border-t border-dotted border-black">
                <span className="uppercase">FORMA DE PAGO:</span>
                <span className="font-bold uppercase">{sale.payment_method.replace('_', ' ')}</span>
              </div>

              {sale.payment_method === 'efectivo' && (
                <>
                  <div className="flex justify-between text-[10px]">
                    <span>PAGO CON:</span>
                    <span>${(Number(sale.amount_paid) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>SU VUELTO:</span>
                    <span>${(Number(sale.change_returned) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pie de Ticket / Código de Validación */}
            <div className="pt-3 text-center space-y-1">
              <div className="text-[10px] font-bold">¡GRACIAS POR SU COMPRA!</div>
              <div className="text-[9px]">Comprobante no válido como factura fiscal</div>
              <div className="text-[8px] font-mono tracking-widest pt-1">
                ||| || ||||| || |||||| |||| |||
              </div>
              <div className="text-[8px] text-gray-600">{sale.id}</div>
            </div>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Nueva Venta
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
