'use client';

import React, { useState, useEffect } from 'react';
import { OrderSpare, ServiceOrder, Shop } from '@/types';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Building2,
  User,
  Wrench,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  DollarSign,
  PackageCheck,
  Send,
} from 'lucide-react';
import { fetchOrderSpares } from '@/lib/supabase/services';

interface DeliveryTicketProps {
  order: ServiceOrder;
  shop?: Shop | null;
  onClose?: () => void;
}

export const DeliveryTicket: React.FC<DeliveryTicketProps> = ({ order, shop, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');
  const [spares, setSpares] = useState<OrderSpare[]>([]);
  const [copiedWsText, setCopiedWsText] = useState(false);

  useEffect(() => {
    async function loadSpares() {
      if (order?.id) {
        try {
          const orderSpares = await fetchOrderSpares(order.id);
          setSpares(orderSpares || []);
        } catch (err) {
          console.error('Error al cargar repuestos de la orden:', err);
        }
      }
    }
    loadSpares();
  }, [order?.id]);

  const handlePrint = () => {
    window.print();
  };

  const shopName = shop?.name || 'TALLER DE SERVICIO TÉCNICO';
  const shopPhone = shop?.settings?.phone || '+54 9 11 4455-6677';
  const termsText =
    shop?.settings?.ticket?.terms ||
    'Equipos no retirados después de 30 días pasarán a disponerse según reglamentación vigente. Garantía válida sobre el trabajo realizado y componentes sustituidos.';

  const deliveredDate = order.delivered_at
    ? new Date(order.delivered_at).toLocaleDateString('es-AR')
    : new Date().toLocaleDateString('es-AR');

  const warrantyUntilDate = order.warranty_until
    ? new Date(order.warranty_until).toLocaleDateString('es-AR')
    : 'N/A';

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${order.tracking_code.replace('#', '')}`
    : `https://jatech.ops/track/${order.tracking_code.replace('#', '')}`;

  // Texto optimizado para WhatsApp
  const generateWhatsAppMessage = () => {
    const lines: string[] = [
      `📱 *COMPROBANTE DE ENTREGA Y GARANTÍA*`,
      `🏢 *${shopName}*`,
      `--------------------------------`,
      `📋 *Orden:* ${order.tracking_code}`,
      `👤 *Cliente:* ${order.customer_name}`,
      `📱 *Equipo:* ${order.device_info}`,
      `✅ *Estado:* ENTREGADO AL CLIENTE`,
      `📅 *Fecha de Entrega:* ${deliveredDate}`,
      ``,
      `🔧 *Trabajo Realizado:*`,
      `${order.technical_diagnosis || order.reported_fault}`,
    ];

    if (spares.length > 0) {
      lines.push(``);
      lines.push(`📦 *Repuestos Utilizados:*`);
      spares.forEach((sp) => {
        lines.push(` • ${sp.name} (${sp.sku}) x${sp.quantity}`);
      });
    }

    lines.push(``);
    lines.push(`🛡️ *Garantía Otorgada:* ${order.warranty_period || 'Sin garantía de plazo corto'}`);
    if (order.warranty_until) {
      lines.push(`📅 *Vencimiento de Garantía:* ${warrantyUntilDate}`);
    }

    lines.push(``);
    lines.push(`💵 *Monto Total Abonado:* $${(order.final_price || 0).toLocaleString('es-AR')}`);
    lines.push(``);
    lines.push(`📜 *Términos y Condiciones:*`);
    lines.push(`${termsText}`);
    lines.push(``);
    lines.push(`¡Muchas gracias por confiar en ${shopName}! Consulta tu comprobante digital aquí:`);
    lines.push(`${trackingUrl}`);

    return lines.join('\n');
  };

  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedWsText(true);
    setTimeout(() => setCopiedWsText(false), 2500);
  };

  const cleanPhone = order.customer_phone ? order.customer_phone.replace(/[^0-9]/g, '') : '';
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generateWhatsAppMessage())}`
    : `https://wa.me/?text=${encodeURIComponent(generateWhatsAppMessage())}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      {/* CONTENEDOR MODAL VISTA PREVIA (Se oculta al imprimir) */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 max-w-2xl w-full space-y-6 shadow-2xl relative print:hidden">
        <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ENTREGADO AL CLIENTE
              </span>
            </div>
            <h3 className="font-title-sm text-lg font-bold text-on-surface flex items-center gap-2 mt-1">
              <PackageCheck className="w-5 h-5 text-emerald-400" /> Comanda & Certificado de Entrega
            </h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          )}
        </div>

        {/* Acciones Rápidas WhatsApp */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">Enviar Comprobante por WhatsApp</h4>
              <p className="text-[11px] text-emerald-400/80">
                Incluye fecha, trabajo, garantía, monto pagado y términos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyWhatsAppText}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-lg text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedWsText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWsText ? '¡Copiado!' : 'Copiar Texto'}
            </button>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Enviar WhatsApp
            </a>
          </div>
        </div>

        {/* Pestañas de Formato de Impresión: 80mm vs Hoja A4 */}
        <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setPrintFormat('80mm')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              printFormat === '80mm'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Printer className="w-4 h-4" /> Comanda Térmica de Entrega (80mm)
          </button>

          <button
            type="button"
            onClick={() => setPrintFormat('a4')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              printFormat === 'a4'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FileText className="w-4 h-4" /> Certificado A4 de Entrega
          </button>
        </div>

        {/* VISTA PREVIA EN PANTALLA */}
        {printFormat === '80mm' ? (
          /* VISTA PREVIA COMANDA 80MM ENTREGADO */
          <div className="bg-white text-black p-4 rounded-xl shadow-inner font-mono text-xs space-y-3 border border-slate-300 max-h-[45vh] overflow-y-auto">
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
              <h2 className="font-bold text-sm uppercase">{shopName}</h2>
              <p className="text-[10px] font-bold tracking-wider text-emerald-800">*** COMPROBANTE DE ENTREGA ***</p>
              <p className="text-[10px]">Tel / WA: {shopPhone}</p>
            </div>

            <div className="text-center py-1.5 bg-emerald-50 rounded border border-emerald-400 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-emerald-900">ORDEN ENTREGADA</span>
              <div className="text-lg font-extrabold font-mono tracking-wider">{order.tracking_code}</div>
            </div>

            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-black">
              <div className="flex justify-between">
                <span className="font-bold">FECHA ENTREGA:</span>
                <span>{deliveredDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">CLIENTE:</span>
                <span>{order.customer_name}</span>
              </div>
              {order.customer_document_id && (
                <div className="flex justify-between">
                  <span className="font-bold">DNI/CUIT:</span>
                  <span>{order.customer_document_id}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-black">
              <div className="font-bold uppercase text-[10px] text-slate-700">DISPOSITIVO</div>
              <div className="font-bold">{order.device_info}</div>
              <div className="mt-1">
                <span className="font-bold">TRABAJO REALIZADO:</span>
                <p className="mt-0.5 text-[11px] font-sans font-medium bg-slate-50 p-1.5 rounded border border-slate-200">
                  {order.technical_diagnosis || order.reported_fault}
                </p>
              </div>
              {spares.length > 0 && (
                <div className="mt-1">
                  <span className="font-bold text-[10px]">REPUESTOS INSTALADOS:</span>
                  <ul className="list-disc list-inside text-[10px]">
                    {spares.map((s) => (
                      <li key={s.id}>{s.name} x{s.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* GARANTÍA OTORGADA */}
            <div className="py-2 px-2.5 bg-slate-100 rounded border border-slate-400 space-y-0.5 my-1">
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-bold text-[10px] uppercase">GARANTÍA OTORGADA:</span>
                <span className="font-extrabold text-xs">{order.warranty_period || 'Sin garantía'}</span>
              </div>
              {order.warranty_until && (
                <div className="flex justify-between text-[10px] text-slate-700 font-bold border-t border-slate-300 pt-1 mt-1">
                  <span>VENCIMIENTO GARANTÍA:</span>
                  <span>{warrantyUntilDate}</span>
                </div>
              )}
            </div>

            {/* PAGADO & SALDADO */}
            <div className="space-y-1 py-1.5 border-b border-dashed border-black bg-emerald-50 px-2 rounded text-emerald-900 border border-emerald-300 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>TOTAL REPARACIÓN:</span>
                <span>${(order.final_price || 0).toLocaleString('es-AR')}</span>
              </div>
              {(order.advance_payment || 0) > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-800">
                  <span>ANTICIPO PREVIO:</span>
                  <span>-${(order.advance_payment || 0).toLocaleString('es-AR')} ({(order.payment_method || 'efectivo').toUpperCase()})</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs border-t border-emerald-300 pt-1 text-emerald-950">
                <span>ESTADO:</span>
                <span>100% SALDADO Y PAGADO</span>
              </div>
            </div>

            <div className="text-[9px] leading-tight text-slate-600 text-center pt-1">
              <p className="italic">{termsText}</p>
              <p className="font-bold mt-2">¡Gracias por su preferencia en {shopName}!</p>
            </div>
          </div>
        ) : (
          /* VISTA PREVIA PLANILLA HOJA A4 ENTREGADO */
          <div className="bg-white text-black p-6 rounded-xl shadow-inner font-sans text-xs space-y-4 border border-slate-300 max-h-[45vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div>
                <h2 className="font-extrabold text-lg uppercase tracking-tight">{shopName}</h2>
                <p className="text-[11px] font-bold text-emerald-700">COMPROBANTE DE ENTREGA Y GARANTÍA TÉCNICA</p>
                <p className="text-[10px] text-slate-600">Contacto: {shopPhone}</p>
              </div>
              <div className="text-right bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">ENTREGADO</span>
                <span className="text-xl font-extrabold font-mono text-slate-900">{order.tracking_code}</span>
                <span className="text-[10px] block font-semibold text-slate-600">
                  Fecha Entrega: {deliveredDate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-700 uppercase block text-[9px]">CLIENTE</span>
                <p className="font-bold text-sm">{order.customer_name}</p>
                <p>DNI / CUIT: {order.customer_document_id || 'S/D'}</p>
                <p>Teléfono: {order.customer_phone || 'Sin número'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 uppercase block text-[9px]">EQUIPO DEL CLIENTE</span>
                <p className="font-bold text-sm">{order.device_info}</p>
                <p className="text-emerald-700 font-bold">Estado: ENTREGADO AL CLIENTE</p>
                <p className="font-extrabold text-sm text-slate-900 mt-1">
                  Total Pagado: ${(order.final_price || 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 uppercase text-[10px]">INFORME DE TRABAJO REALIZADO</span>
              <p className="font-semibold text-xs text-slate-900">{order.technical_diagnosis || order.reported_fault}</p>
              {spares.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-700">Repuestos Utilizados:</span>
                  <p className="text-slate-800 mt-0.5">
                    {spares.map((s) => `${s.name} (x${s.quantity})`).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* CUADRO DE GARANTÍA */}
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg flex justify-between items-center text-xs font-bold text-emerald-900">
              <div>
                <span className="block text-[10px] uppercase text-emerald-700">GARANTÍA OTORGADA</span>
                <span className="text-sm">{order.warranty_period || 'Sin garantía'}</span>
              </div>
              {order.warranty_until && (
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-emerald-700">FECHA DE VENCIMIENTO</span>
                  <span className="text-sm">{warrantyUntilDate}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-600 leading-relaxed">
              <p className="italic">{termsText}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[10px] font-bold">
              <div className="border-t border-black pt-1">
                Conformidad de Recepción Cliente
              </div>
              <div className="border-t border-black pt-1">
                Firma y Sello del Técnico / Taller
              </div>
            </div>
          </div>
        )}

        {/* ACCIONES DEL MODAL */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-title-sm text-xs font-bold py-3 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 font-title-sm text-xs font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir Comanda de Entrega ({printFormat === '80mm' ? '80mm' : 'Hoja A4'})
          </button>
        </div>
      </div>

      {/* FORMATO EXCLUSIVO IMPRESIÓN CSS FOR TICKET 80MM ENTREGADO */}
      {printFormat === '80mm' && (
        <div className="hidden print:block print:w-[80mm] print:p-2 print:m-0 print:bg-white print:text-black font-mono text-[10px] leading-tight">
          <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
            <h1 className="font-bold text-xs uppercase">{shopName}</h1>
            <p className="text-[9px] font-bold uppercase">COMPROBANTE DE ENTREGA</p>
            <p className="text-[9px]">TEL/WA: {shopPhone}</p>
          </div>

          <div className="text-center py-1.5 mb-2 bg-gray-100 rounded border border-black">
            <span className="text-[8px] uppercase font-bold">ENTREGADO - ORDEN</span>
            <div className="text-lg font-bold">{order.tracking_code}</div>
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div><strong>FECHA ENTREGA:</strong> {deliveredDate}</div>
            <div><strong>CLIENTE:</strong> {order.customer_name}</div>
            {order.customer_document_id && <div><strong>DNI/CUIT:</strong> {order.customer_document_id}</div>}
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div className="font-bold uppercase">DISPOSITIVO</div>
            <div>{order.device_info}</div>
            <div><strong>TRABAJO:</strong> {order.technical_diagnosis || order.reported_fault}</div>
            {spares.length > 0 && (
              <div><strong>REPUESTOS:</strong> {spares.map((s) => `${s.name} x${s.quantity}`).join(', ')}</div>
            )}
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div><strong>GARANTÍA OTORGADA:</strong> {order.warranty_period || 'Sin garantía'}</div>
            {order.warranty_until && <div><strong>VENCE GARANTÍA:</strong> {warrantyUntilDate}</div>}
          </div>

          <div className="flex justify-between font-bold text-xs pb-2 mb-2 border-b border-dashed border-black">
            <span>MONTO PAGADO:</span>
            <span>${(order.final_price || 0).toLocaleString('es-AR')}</span>
          </div>

          <div className="text-[8px] text-center pt-1">
            <p>{termsText}</p>
            <p className="font-bold mt-2">{trackingUrl}</p>
          </div>
        </div>
      )}

      {/* FORMATO EXCLUSIVO IMPRESIÓN CSS FOR HOJA A4 ENTREGADO */}
      {printFormat === 'a4' && (
        <div className="hidden print:block print:w-full print:p-8 print:m-0 print:bg-white print:text-black font-sans text-xs space-y-6">
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <h1 className="font-extrabold text-xl uppercase">{shopName}</h1>
              <p className="text-xs font-bold text-gray-700">COMPROBANTE DE ENTREGA Y CERTIFICADO DE GARANTÍA</p>
              <p className="text-xs">Teléfono / WhatsApp: {shopPhone}</p>
            </div>
            <div className="text-right border border-black p-3 rounded bg-gray-50">
              <span className="text-xs font-bold block uppercase">ORDEN ENTREGADA</span>
              <span className="text-2xl font-extrabold font-mono">{order.tracking_code}</span>
              <span className="text-xs block font-semibold">Fecha Entrega: {deliveredDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 border border-black rounded text-xs">
            <div>
              <span className="font-bold uppercase text-[10px] text-gray-600 block mb-1">DATOS DEL CLIENTE</span>
              <p className="font-bold text-sm">{order.customer_name}</p>
              <p>DNI / CUIT: {order.customer_document_id || 'S/D'}</p>
              <p>Teléfono: {order.customer_phone || 'Sin número'}</p>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-gray-600 block mb-1">DATOS DEL DISPOSITIVO</span>
              <p className="font-bold text-sm">{order.device_info}</p>
              <p className="font-bold">Estado: ENTREGADO AL CLIENTE</p>
              <p className="font-extrabold text-sm text-black">Monto Pagado: ${(order.final_price || 0).toLocaleString('es-AR')}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border border-black rounded space-y-2">
            <span className="font-bold uppercase text-[10px] text-gray-600">TRABAJO REALIZADO Y DIAGNÓSTICO</span>
            <p className="font-bold text-sm">{order.technical_diagnosis || order.reported_fault}</p>
            {spares.length > 0 && (
              <p className="text-xs text-gray-800">
                <strong>Repuestos Sustituidos:</strong> {spares.map((s) => `${s.name} x${s.quantity}`).join(', ')}
              </p>
            )}
          </div>

          <div className="border border-black p-4 rounded bg-gray-50 flex justify-between items-center text-xs font-bold">
            <div>
              <span className="block text-[10px] uppercase text-gray-600">GARANTÍA DE REPARACIÓN</span>
              <span className="text-sm">{order.warranty_period || 'Sin garantía'}</span>
            </div>
            {order.warranty_until && (
              <div className="text-right">
                <span className="block text-[10px] uppercase text-gray-600">VENCIMIENTO DE GARANTÍA</span>
                <span className="text-sm">{warrantyUntilDate}</span>
              </div>
            )}
          </div>

          <div className="border-t border-black pt-3 text-[10px] text-gray-700 leading-relaxed">
            <p className="italic">{termsText}</p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs font-bold">
            <div className="border-t border-black pt-2">
              Conformidad de Recepción Cliente
            </div>
            <div className="border-t border-black pt-2">
              Firma y Sello del Técnico / Taller
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
