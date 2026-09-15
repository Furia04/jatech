'use client';

import React, { useState } from 'react';
import { ServiceOrder, Shop } from '@/types';
import { Printer, X, FileText, CheckCircle2, Building2, User, Wrench, ShieldCheck } from 'lucide-react';

interface ThermalTicketProps {
  order: ServiceOrder;
  shop?: Shop | null;
  onClose?: () => void;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({ order, shop, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');

  const handlePrint = () => {
    window.print();
  };

  const shopName = shop?.name || 'TALLER DE SERVICIO TÉCNICO';
  const shopPhone = (shop as any)?.phone || '+54 9 11 4455-6677';
  const termsText = (shop?.settings as any)?.ticket?.terms || 
    'Equipos no retirados después de 30 días pasarán a disponerse según reglamentación vigente. Garantía de reparación: 30 días sobre la falla reparada.';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      {/* CONTENEDOR MODAL VISTA PREVIA (Se oculta en impresión) */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 max-w-2xl w-full space-y-6 shadow-2xl relative print:hidden">
        <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
          <div>
            <span className="font-label-caps text-[10px] text-primary uppercase font-bold">DOCUMENTO DE ORDEN DE SERVICIO</span>
            <h3 className="font-title-sm text-base font-bold text-on-surface flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" /> Imprimir u Ordenar Documento
            </h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          )}
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
            <Printer className="w-4 h-4" /> Comanda Térmica (80mm)
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
            <FileText className="w-4 h-4" /> Hoja Completa A4 (Certificado & Firma)
          </button>
        </div>

        {/* VISTA PREVIA EN PANTALLA */}
        {printFormat === '80mm' ? (
          /* VISTA PREVIA COMANDA 80MM */
          <div className="bg-white text-black p-4 rounded-xl shadow-inner font-mono text-xs space-y-3 border border-slate-300 max-h-[50vh] overflow-y-auto">
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
              <h2 className="font-bold text-sm uppercase">{shopName}</h2>
              <p className="text-[10px]">SERVICIOS Y REPARACIONES</p>
              <p className="text-[10px]">Tel / WhatsApp: {shopPhone}</p>
            </div>

            <div className="text-center py-2 bg-slate-100 rounded border border-slate-300 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-600">CÓDIGO DE ORDEN</span>
              <div className="text-xl font-extrabold tracking-wider">{order.tracking_code}</div>
            </div>

            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-black">
              <div className="flex justify-between">
                <span className="font-bold">FECHA:</span>
                <span>{new Date(order.created_at).toLocaleDateString('es-AR')}</span>
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
              {order.customer_phone && (
                <div className="flex justify-between">
                  <span className="font-bold">TEL:</span>
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-black">
              <div className="font-bold uppercase text-[10px] text-slate-700">EQUIPO DE REPARACIÓN</div>
              <div className="font-bold">{order.device_info}</div>
              <div>
                <span className="font-bold">FALLA REPORTADA:</span>
                <p className="mt-0.5 italic">{order.reported_fault}</p>
              </div>
            </div>

            {order.warranty_period && (
              <div className="py-1 px-2 bg-slate-100 rounded border border-slate-400 text-center space-y-0.5 my-1">
                <span className="font-bold text-[9px] uppercase text-slate-800">GARANTÍA OTORGADA:</span>
                <p className="font-extrabold text-[11px] text-slate-900">{order.warranty_period}</p>
                {order.warranty_until && (
                  <p className="text-[9px] text-slate-600">
                    Vence: {new Date(order.warranty_until).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            )}

            {order.final_price && order.final_price > 0 ? (
              <div className="space-y-1 py-1.5 border-b border-dashed border-black text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>PRECIO ESTIMADO:</span>
                  <span>${order.final_price.toLocaleString('es-AR')}</span>
                </div>
                {(order.advance_payment || 0) > 0 && (
                  <div className="flex justify-between text-slate-800">
                    <span>SEÑA ({(order.payment_method || 'efectivo').toUpperCase()}):</span>
                    <span>-${(order.advance_payment || 0).toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold border-t border-dotted border-black pt-1">
                  <span>SALDO AL RETIRAR:</span>
                  <span>${Math.max(0, (order.final_price || 0) - (order.advance_payment || 0)).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ) : null}

            <div className="text-[9px] leading-tight text-slate-600 text-center pt-1">
              <p className="italic">{termsText}</p>
              <p className="font-bold mt-2">¡Gracias por confiar en {shopName}!</p>
            </div>
          </div>
        ) : (
          /* VISTA PREVIA PLANILLA HOJA A4 */
          <div className="bg-white text-black p-6 rounded-xl shadow-inner font-sans text-xs space-y-4 border border-slate-300 max-h-[50vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div>
                <h2 className="font-extrabold text-lg uppercase tracking-tight">{shopName}</h2>
                <p className="text-[11px] font-semibold text-slate-700">ORDEN Y CERTIFICADO DE INGRESO TÉCNICO</p>
                <p className="text-[10px] text-slate-600">Contacto: {shopPhone}</p>
              </div>
              <div className="text-right bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">ORDEN DE SERVICIO</span>
                <span className="text-xl font-extrabold font-mono text-slate-900">{order.tracking_code}</span>
                <span className="text-[10px] block font-semibold text-slate-500">
                  Fecha: {new Date(order.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-700 uppercase block text-[9px]">DATOS DEL CLIENTE</span>
                <p className="font-bold text-sm">{order.customer_name}</p>
                <p>DNI / CUIT: {order.customer_document_id || 'S/D'}</p>
                <p>Teléfono: {order.customer_phone || 'Sin teléfono'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 uppercase block text-[9px]">DATOS DEL DISPOSITIVO</span>
                <p className="font-bold text-sm">{order.device_info}</p>
                <p>Estado Actual: {order.status.toUpperCase()}</p>
                <p>Precio Presupuestado: ${ (order.final_price || 0).toLocaleString('es-AR') }</p>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 uppercase text-[10px]">FALLA Y DIAGNÓSTICO DETALLADO</span>
              <p className="font-semibold text-xs text-slate-900">Falla Reportada: {order.reported_fault}</p>
              {order.technical_diagnosis && (
                <p className="text-xs text-slate-700 mt-1">Informe Técnico: {order.technical_diagnosis}</p>
              )}
              {order.warranty_period && (
                <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>GARANTÍA DE SERVICIO OTORGADA: {order.warranty_period}</span>
                  {order.warranty_until && (
                    <span>Vencimiento: {new Date(order.warranty_until).toLocaleDateString('es-AR')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Resumen Financiero en Hoja A4 */}
            <div className="grid grid-cols-3 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300 text-center font-mono">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-600 block">PRESUPUESTO</span>
                <span className="font-bold text-xs">${(order.final_price || 0).toLocaleString('es-AR')}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">SEÑA RECIBIDA</span>
                <span className="font-bold text-xs text-emerald-800">${(order.advance_payment || 0).toLocaleString('es-AR')} ({(order.payment_method || 'efectivo').toUpperCase()})</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-900 block">SALDO A COBRAR</span>
                <span className="font-extrabold text-xs text-slate-900">${Math.max(0, (order.final_price || 0) - (order.advance_payment || 0)).toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-600 leading-relaxed">
              <p className="italic">{termsText}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] font-bold">
              <div className="border-t border-black pt-1">
                Firma y Aclaración del Cliente
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
              Guardar / Cerrar
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir en {printFormat === '80mm' ? 'Comanda Térmica (80mm)' : 'Hoja A4'}
          </button>
        </div>
      </div>

      {/* FORMATO EXCLUSIVO IMPRESIÓN MEDIA CSS FOR TICKET 80MM */}
      {printFormat === '80mm' && (
        <div className="hidden print:block print:w-[80mm] print:p-2 print:m-0 print:bg-white print:text-black font-mono text-[10px] leading-tight">
          <div className="text-center pb-2 mb-2 border-b border-dashed border-black">
            <h1 className="font-bold text-xs uppercase">{shopName}</h1>
            <p className="text-[9px]">SERVICIOS Y REPARACIONES</p>
            <p className="text-[9px]">TEL/WA: {shopPhone}</p>
          </div>

          <div className="text-center py-2 mb-2 bg-gray-100 rounded border border-black">
            <span className="text-[8px] uppercase font-bold">CÓDIGO DE ORDEN</span>
            <div className="text-lg font-bold">{order.tracking_code}</div>
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div><strong>FECHA:</strong> {new Date(order.created_at).toLocaleDateString('es-AR')}</div>
            <div><strong>CLIENTE:</strong> {order.customer_name}</div>
            {order.customer_document_id && <div><strong>DNI/CUIT:</strong> {order.customer_document_id}</div>}
            {order.customer_phone && <div><strong>TEL:</strong> {order.customer_phone}</div>}
          </div>

          <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
            <div className="font-bold uppercase">EQUIPO</div>
            <div>{order.device_info}</div>
            <div><strong>FALLA:</strong> {order.reported_fault}</div>
          </div>

          {order.final_price && order.final_price > 0 ? (
            <div className="pb-2 mb-2 border-b border-dashed border-black space-y-0.5">
              <div><strong>TOTAL:</strong> ${order.final_price.toLocaleString('es-AR')}</div>
              {(order.advance_payment || 0) > 0 && (
                <div><strong>SEÑA ({(order.payment_method || 'efectivo').toUpperCase()}):</strong> -${(order.advance_payment || 0).toLocaleString('es-AR')}</div>
              )}
              <div><strong>SALDO A COBRAR:</strong> ${Math.max(0, (order.final_price || 0) - (order.advance_payment || 0)).toLocaleString('es-AR')}</div>
            </div>
          ) : null}

          <div className="text-[8px] text-center pt-1">
            <p>{termsText}</p>
            <p className="font-bold mt-2">www.jatech.ops / {order.tracking_code}</p>
          </div>
        </div>
      )}

      {/* FORMATO EXCLUSIVO IMPRESIÓN MEDIA CSS FOR HOJA A4 */}
      {printFormat === 'a4' && (
        <div className="hidden print:block print:w-full print:p-8 print:m-0 print:bg-white print:text-black font-sans text-xs space-y-6">
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <h1 className="font-extrabold text-xl uppercase">{shopName}</h1>
              <p className="text-xs font-bold text-gray-700">SERVICIOS DE REPARACIÓN Y ASISTENCIA TÉCNICA</p>
              <p className="text-xs">Teléfono / WhatsApp: {shopPhone}</p>
            </div>
            <div className="text-right border border-black p-3 rounded">
              <span className="text-xs font-bold block uppercase">ORDEN DE SERVICIO</span>
              <span className="text-2xl font-extrabold font-mono">{order.tracking_code}</span>
              <span className="text-xs block font-semibold">Fecha: {new Date(order.created_at).toLocaleDateString('es-AR')}</span>
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
              <p>Estado de la Orden: {order.status.toUpperCase()}</p>
              <p>Precio Estimado: ${ (order.final_price || 0).toLocaleString('es-AR') }</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border border-black rounded space-y-2">
            <span className="font-bold uppercase text-[10px] text-gray-600">FALLA Y DIAGNÓSTICO</span>
            <p className="font-bold text-sm">Falla Reportada: {order.reported_fault}</p>
            {order.technical_diagnosis && (
              <p className="text-xs">Diagnóstico / Informe Técnico: {order.technical_diagnosis}</p>
            )}
          </div>

          <div className="border-t border-black pt-3 text-[10px] text-gray-700 leading-relaxed">
            <p className="italic">{termsText}</p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs font-bold">
            <div className="border-t border-black pt-2">
              Firma y Aclaración del Cliente
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
