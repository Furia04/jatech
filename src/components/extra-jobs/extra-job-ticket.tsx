'use client';

import React, { useState } from 'react';
import { ExtraJob, Shop } from '@/types';
import {
  Printer,
  X,
  FileText,
  Building2,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

interface ExtraJobTicketProps {
  job: ExtraJob;
  shop?: Shop | null;
  onClose?: () => void;
}

export const ExtraJobTicket: React.FC<ExtraJobTicketProps> = ({ job, shop, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('a4');

  const handlePrint = () => {
    window.print();
  };

  const shopName = shop?.name || 'SERVICIO TÉCNICO Y SOLUCIONES';
  const shopPhone = shop?.settings?.phone || '';
  const pendingBalance = Math.max(0, job.total_price - job.advance_payment);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const createdDate = new Date(job.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const scheduledDate = job.scheduled_at
    ? new Date(job.scheduled_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'A convenir';

  const statusLabelMap: Record<string, string> = {
    presupuestado: 'PRESUPUESTADO / COTIZACIÓN',
    agendado: 'AGENDADO PARA VISITA',
    en_progreso: 'EN EJECUCIÓN',
    completado: 'FINALIZADO / POR COBRAR',
    cobrado: 'COBRADO / LIQUIDADO',
    cancelado: 'CANCELADO',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible">
      
      {/* Controles de Pantalla (Ocultos al Imprimir) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-surface-container-high p-2 rounded-2xl border border-outline-variant shadow-2xl">
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
          <button
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              printFormat === 'a4'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hoja A4
          </button>
          <button
            onClick={() => setPrintFormat('80mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              printFormat === '80mm'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ticket 80mm
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / PDF</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contenedor del Documento Imprimible */}
      <div
        className={`bg-white text-slate-900 rounded-xl shadow-2xl transition-all overflow-hidden my-auto print:shadow-none print:m-0 print:rounded-none ${
          printFormat === 'a4'
            ? 'w-full max-w-3xl p-10 font-sans print:p-8 print:w-full print:max-w-none'
            : 'w-[80mm] p-4 text-xs font-mono print:w-[80mm] print:p-2'
        }`}
      >
        {/* FORMATO A4 */}
        {printFormat === 'a4' ? (
          <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {shopName}
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Servicios Técnicos • Instalaciones • Redes • Seguridad Electrónica
                </p>
                {shopPhone && (
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Tel: {shopPhone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-sm font-mono font-bold">
                  ORDEN: {job.job_code}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Fecha Emisión: {createdDate}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-800 border border-slate-300">
                  {statusLabelMap[job.status] || job.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Datos del Cliente y Ubicación */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Datos del Cliente
                </p>
                <p className="text-sm font-bold text-slate-900">{job.customer_name}</p>
                {job.customer_phone && (
                  <p className="text-slate-600 font-mono">Tel: {job.customer_phone}</p>
                )}
                {job.customer_document_id && (
                  <p className="text-slate-600">DNI/CUIT: {job.customer_document_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Lugar y Fecha de Trabajo
                </p>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  📍 {job.location_address || 'Dirección no especificada'}
                </p>
                <p className="text-slate-700 font-medium">
                  🗓️ Visita: <span className="font-mono">{scheduledDate}</span>
                </p>
                {job.technician_name && (
                  <p className="text-slate-600">Técnico a cargo: {job.technician_name}</p>
                )}
              </div>
            </div>

            {/* Detalle del Trabajo */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descripción del Trabajo / Servicio
              </h2>
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <p className="text-sm font-bold text-slate-900">{job.title}</p>
                {job.description && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                )}
                {job.technical_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
                    Notas técnicas: {job.technical_notes}
                  </div>
                )}
              </div>
            </div>

            {/* Desglose Económico */}
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Resumen Económico
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 text-left">Concepto</th>
                    <th className="py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {job.labor_price > 0 && (
                    <tr>
                      <td className="py-2.5 text-slate-800">Mano de Obra y Servicios Técnicos</td>
                      <td className="py-2.5 text-right font-mono text-slate-900">{formatCurrency(job.labor_price)}</td>
                    </tr>
                  )}
                  {job.materials_price > 0 && (
                    <tr>
                      <td className="py-2.5 text-slate-800">Materiales, Componentes e Insumos</td>
                      <td className="py-2.5 text-right font-mono text-slate-900">{formatCurrency(job.materials_price)}</td>
                    </tr>
                  )}
                  {job.labor_price === 0 && job.materials_price === 0 && (
                    <tr>
                      <td className="py-2.5 text-slate-800">Servicio Técnico / Cotización Global</td>
                      <td className="py-2.5 text-right font-mono text-slate-900">{formatCurrency(job.total_price)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold text-sm">
                    <td className="pt-3 text-slate-900 uppercase">Total Presupuestado</td>
                    <td className="pt-3 text-right font-mono text-slate-900">{formatCurrency(job.total_price)}</td>
                  </tr>
                  {job.advance_payment > 0 && (
                    <tr className="text-xs text-slate-600">
                      <td className="py-1">Anticipo / Seña Recibida</td>
                      <td className="py-1 text-right font-mono text-emerald-700">-{formatCurrency(job.advance_payment)}</td>
                    </tr>
                  )}
                  <tr className="text-sm font-bold text-slate-900 bg-slate-100">
                    <td className="py-2 px-3 rounded-l">Saldo Pendiente</td>
                    <td className="py-2 px-3 text-right font-mono rounded-r">
                      {formatCurrency(pendingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Firmas y Conformidad */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-700">Firma del Técnico Responsable</p>
                <p className="text-[10px] mt-0.5">{shopName}</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-700">Conformidad del Cliente</p>
                <p className="text-[10px] mt-0.5">{job.customer_name}</p>
              </div>
            </div>
          </div>
        ) : (
          /* FORMATO TICKET 80MM */
          <div className="space-y-3">
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <h2 className="font-black text-sm uppercase">{shopName}</h2>
              <p className="text-[10px] text-slate-600">TRABAJOS EN TERRENO Y SERVICIOS</p>
              {shopPhone && <p className="text-[10px] text-slate-600">Tel: {shopPhone}</p>}
            </div>

            <div className="text-center font-bold text-xs py-1 bg-slate-100 border border-slate-300">
              ORDEN: {job.job_code}
            </div>

            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-2">
              <p><strong>Cliente:</strong> {job.customer_name}</p>
              {job.customer_phone && <p><strong>Tel:</strong> {job.customer_phone}</p>}
              <p><strong>Lugar:</strong> {job.location_address || 'En sitio'}</p>
              <p><strong>Fecha Visita:</strong> {scheduledDate}</p>
            </div>

            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-2">
              <p className="font-bold uppercase">Trabajo:</p>
              <p className="font-medium">{job.title}</p>
              {job.description && (
                <p className="text-[10px] text-slate-600 whitespace-pre-wrap mt-1">{job.description}</p>
              )}
            </div>

            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-2">
              {job.labor_price > 0 && (
                <div className="flex justify-between">
                  <span>Mano de Obra:</span>
                  <span className="font-mono">{formatCurrency(job.labor_price)}</span>
                </div>
              )}
              {job.materials_price > 0 && (
                <div className="flex justify-between">
                  <span>Materiales:</span>
                  <span className="font-mono">{formatCurrency(job.materials_price)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="font-mono">{formatCurrency(job.total_price)}</span>
              </div>
              {job.advance_payment > 0 && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Anticipo:</span>
                  <span className="font-mono">-{formatCurrency(job.advance_payment)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1">
                <span>SALDO:</span>
                <span className="font-mono">{formatCurrency(pendingBalance)}</span>
              </div>
            </div>

            <div className="text-center pt-4 text-[10px] text-slate-500">
              <div className="border-t border-dashed border-slate-400 pt-2 mb-2">
                Firma de Conformidad
              </div>
              ¡Gracias por elegir nuestros servicios!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
