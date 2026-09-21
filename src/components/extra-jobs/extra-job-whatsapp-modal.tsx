'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Send,
  Sparkles,
  Phone,
  User,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
} from 'lucide-react';
import { ExtraJob, Shop } from '@/types';

export type ExtraJobWhatsAppTemplate =
  | 'presupuesto'
  | 'visita'
  | 'completado'
  | 'personalizado';

interface ExtraJobWhatsAppModalProps {
  job: ExtraJob;
  shop?: Shop | null;
  onClose: () => void;
  defaultTemplate?: ExtraJobWhatsAppTemplate;
}

export function ExtraJobWhatsAppModal({
  job,
  shop,
  onClose,
  defaultTemplate = 'presupuesto',
}: ExtraJobWhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ExtraJobWhatsAppTemplate>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(job.customer_phone || '');
  const [copied, setCopied] = useState(false);

  const shopName = shop?.name || 'Servicio Técnico';
  const pendingBalance = Math.max(0, job.total_price - job.advance_payment);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatScheduledDate = (dateStr?: string | null) => {
    if (!dateStr) return 'A coordinar';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTemplateText = (templateKey: ExtraJobWhatsAppTemplate): string => {
    const custName = job.customer_name || 'Estimado/a';
    const jobTitle = job.title;
    const address = job.location_address ? `📍 *Dirección:* ${job.location_address}\n` : '';
    const scheduled = job.scheduled_at ? `🗓️ *Fecha programada:* ${formatScheduledDate(job.scheduled_at)}\n` : '';
    const code = job.job_code;

    switch (templateKey) {
      case 'presupuesto':
        return `Hola *${custName}*, te contactamos de *${shopName}* referente al trabajo *${code}* (*${jobTitle}*).\n\n` +
          `📋 *Detalle del Presupuesto:*\n` +
          (job.labor_price > 0 ? `• Mano de Obra / Servicio: ${formatCurrency(job.labor_price)}\n` : '') +
          (job.materials_price > 0 ? `• Materiales e Insumos: ${formatCurrency(job.materials_price)}\n` : '') +
          `💰 *Total Presupuestado:* ${formatCurrency(job.total_price)}\n` +
          (job.advance_payment > 0 ? `💵 *Seña / Anticipo recibido:* ${formatCurrency(job.advance_payment)}\n💳 *Saldo pendiente:* ${formatCurrency(pendingBalance)}\n` : '') +
          (address ? `\n${address}` : '') +
          `\nPor favor, confírmanos si estás de acuerdo para proceder a coordinar la visita. ¡Muchas gracias!`;

      case 'visita':
        return `Hola *${custName}*, te escribimos de *${shopName}* para coordinar el trabajo *${code}* (*${jobTitle}*).\n\n` +
          `${scheduled}` +
          `${address}` +
          `\nEl técnico asignado acudirá en el horario pactado. Cualquier cambio o requerimiento previo, avísanos por este medio. ¡Saludos!`;

      case 'completado':
        return `Hola *${custName}*, te informamos de *${shopName}* que el trabajo *${code}* (*${jobTitle}*) ha sido *completado con éxito* ✅.\n\n` +
          `💰 *Total del Trabajo:* ${formatCurrency(job.total_price)}\n` +
          (job.advance_payment > 0 ? `💵 *Anticipo abonado:* ${formatCurrency(job.advance_payment)}\n` : '') +
          (pendingBalance > 0
            ? `💳 *Saldo pendiente a abonar:* ${formatCurrency(pendingBalance)}\n\n`
            : `\n✨ *El pago ha sido cancelado en su totalidad.*\n\n`) +
          `¡Muchas gracias por confiar en nuestros servicios!`;

      case 'personalizado':
        return customMessage || `Hola ${custName}, te contactamos de ${shopName} sobre el trabajo ${code} (${jobTitle})...`;

      default:
        return '';
    }
  };

  const currentMessageText = isEditingCustom && selectedTemplate === 'personalizado'
    ? customMessage
    : getTemplateText(selectedTemplate);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!cleanPhone) {
      alert('Por favor ingresa un número de teléfono válido.');
      return;
    }
    const encodedText = encodeURIComponent(currentMessageText);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const templates: { key: ExtraJobWhatsAppTemplate; label: string; icon: any; color: string }[] = [
    { key: 'presupuesto', label: 'Presupuesto', icon: DollarSign, color: 'text-amber-400 border-amber-500/30' },
    { key: 'visita', label: 'Confirmar Visita', icon: Calendar, color: 'text-blue-400 border-blue-500/30' },
    { key: 'completado', label: 'Trabajo Finalizado', icon: Check, color: 'text-emerald-400 border-emerald-500/30' },
    { key: 'personalizado', label: 'Personalizado', icon: Sparkles, color: 'text-purple-400 border-purple-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                Notificación por WhatsApp
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-primary border border-outline-variant font-mono">
                  {job.job_code}
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant truncate max-w-md">
                {job.title} • {job.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Teléfono del destinatario */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-on-surface-variant" />
              <span className="text-sm font-medium text-on-surface">{job.customer_name || 'Sin Cliente'}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Phone className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: 5491112345678"
                className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface font-mono focus:outline-none focus:border-primary w-full sm:w-44"
              />
            </div>
          </div>

          {/* Selector de Plantillas */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2.5">
              Seleccionar Plantilla de Mensaje
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {templates.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.key;
                return (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tmpl.key);
                      if (tmpl.key === 'personalizado' && !customMessage) {
                        setCustomMessage(getTemplateText('presupuesto'));
                        setIsEditingCustom(true);
                      }
                    }}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all text-xs font-medium gap-1.5 ${
                      isSelected
                        ? 'bg-surface-container-high border-primary text-primary shadow-sm ring-1 ring-primary/30'
                        : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vista previa / Editor del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Contenido del Mensaje
              </label>
              {selectedTemplate === 'personalizado' && (
                <span className="text-[11px] text-amber-400">✏️ Modo edición libre</span>
              )}
            </div>

            {selectedTemplate === 'personalizado' ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={7}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 text-xs font-sans text-on-surface leading-relaxed focus:outline-none focus:border-primary resize-none placeholder:text-on-surface-variant/40"
                placeholder="Escribe aquí el mensaje personalizado para el cliente..."
              />
            ) : (
              <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-xs font-sans text-on-surface leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
                {currentMessageText}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Listo para enviar a través de WhatsApp Web / App
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
