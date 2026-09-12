'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Send,
  Sparkles,
  Phone,
  User,
  Wrench,
  Receipt,
  FileText,
  Clock,
  AlertTriangle,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { ServiceOrder, Shop } from '@/types';

export type WhatsAppTemplateKey =
  | 'ingreso'
  | 'presupuesto'
  | 'listo'
  | 'repuestos'
  | 'recordatorio'
  | 'personalizado';

interface WhatsAppModalProps {
  order: ServiceOrder;
  shop?: Shop | null;
  onClose: () => void;
  defaultTemplate?: WhatsAppTemplateKey;
}

export function WhatsAppModal({
  order,
  shop,
  onClose,
  defaultTemplate = 'listo',
}: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateKey>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(order.customer_phone || '');
  const [copied, setCopied] = useState(false);

  const shopName = shop?.name || 'Nuestro Taller';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://satjatech.vercel.app';
  const cleanTrackingCode = order.tracking_code.replace('#', '');
  const trackingLink = `${siteUrl}/track/${cleanTrackingCode}`;

  const finalPrice = order.final_price || 0;
  const advancePayment = order.advance_payment || 0;
  const pendingBalance = Math.max(0, finalPrice - advancePayment);

  // Formatear textos con variables dinámicas
  const getTemplateText = (templateKey: WhatsAppTemplateKey): string => {
    const customerName = order.customer_name || 'Estimado/a cliente';
    const deviceInfo = order.device_info || 'su equipo';
    const code = order.tracking_code;

    switch (templateKey) {
      case 'ingreso':
        return (
          `👋 ¡Hola ${customerName}! Te confirmamos que tu *${deviceInfo}* ingresó correctamente a *${shopName}* (Orden *${code}*).\n\n` +
          (advancePayment > 0
            ? `💰 *Seña entregada:* $${advancePayment.toLocaleString('es-AR')}\n\n`
            : '') +
          `🔍 Podés consultar el estado de tu equipo y el diagnóstico en tiempo real desde este enlace:\n` +
          `👉 ${trackingLink}\n\n` +
          `Te estaremos notificando cuando tengamos el diagnóstico listo. ¡Muchas gracias!`
        );

      case 'presupuesto':
        return (
          `🔧 ¡Hola ${customerName}! Desde *${shopName}* te informamos que ya revisamos tu *${deviceInfo}* (Orden *${code}*).\n\n` +
          `📋 *Diagnóstico técnico:*\n_${order.technical_diagnosis || order.reported_fault || 'Revisión técnica completada'}_\n\n` +
          `💵 *Presupuesto total:* $${finalPrice.toLocaleString('es-AR')}\n` +
          (advancePayment > 0
            ? `💳 *Seña previa:* $${advancePayment.toLocaleString('es-AR')}\n` +
              `💰 *Saldo a abonar:* $${pendingBalance.toLocaleString('es-AR')}\n`
            : '') +
          `\n🔍 Podés ver el detalle completo aquí:\n👉 ${trackingLink}\n\n` +
          `¿Nos confirmás si procedemos con la reparación? ¡Quedamos a tu disposición!`
        );

      case 'listo':
        return (
          `🎉 ¡Hola ${customerName}! Te avisamos que tu *${deviceInfo}* ya está *LISTO PARA RETIRAR* en *${shopName}* (Orden *${code}*).\n\n` +
          (finalPrice > 0
            ? pendingBalance > 0
              ? `💰 *Saldo restante a pagar al retirar:* $${pendingBalance.toLocaleString('es-AR')}\n` +
                (advancePayment > 0 ? `_(Seña previa registrada: $${advancePayment.toLocaleString('es-AR')})_\n` : '')
              : `✅ *Estado de pago:* Totalmente abonado / Saldado.\n`
            : '') +
          `\n📄 Comprobante y garantía:\n👉 ${trackingLink}\n\n` +
          `Podés pasar a retirarlo en nuestros horarios de atención. ¡Te esperamos!`
        );

      case 'repuestos':
        return (
          `📦 Hola ${customerName}, te escribimos de *${shopName}* para informarte que tu *${deviceInfo}* (Orden *${code}*) se encuentra a la espera de los repuestos necesarios para finalizar el trabajo.\n\n` +
          `Apenas ingrese el componente y quede 100% probado te avisaremos para que puedas retirarlo.\n\n` +
          `🔍 Podés seguir la orden aquí: ${trackingLink}`
        );

      case 'recordatorio':
        return (
          `⚠️ Hola ${customerName}, te recordamos desde *${shopName}* que tu *${deviceInfo}* (Orden *${code}*) está terminado y disponible para retiro.\n\n` +
          (pendingBalance > 0 ? `💰 *Saldo pendiente:* $${pendingBalance.toLocaleString('es-AR')}\n` : '') +
          `Agradecemos que puedas pasar a retirarlo a la brevedad.\n\n` +
          `👉 Detalle de la orden: ${trackingLink}`
        );

      case 'personalizado':
        return customMessage || `Hola ${customerName}, te escribimos de ${shopName} por tu orden ${code}.`;
    }
  };

  const currentMessage = isEditingCustom ? customMessage : getTemplateText(selectedTemplate);

  useEffect(() => {
    setCustomMessage(getTemplateText(selectedTemplate));
  }, [selectedTemplate]);

  // Limpiar y normalizar número de teléfono para wa.me
  const cleanPhoneForUrl = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, '');
    // Si es de Argentina y empieza con 15 o no tiene el 54 9, intentar normalizar
    if (clean.length === 10 && !clean.startsWith('54')) {
      clean = `549${clean}`;
    } else if (clean.length === 8) {
      clean = `54911${clean}`;
    }
    return clean;
  };

  const handleOpenWhatsApp = () => {
    const formattedPhone = cleanPhoneForUrl(phoneNumber);
    const encodedText = encodeURIComponent(currentMessage);
    const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const templatesList: { key: WhatsAppTemplateKey; title: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'ingreso',
      title: 'Comprobante de Ingreso',
      icon: <Receipt className="w-4 h-4 text-primary" />,
      desc: 'Confirmación de recepción + seña + link',
    },
    {
      key: 'presupuesto',
      title: 'Presupuesto y Diagnóstico',
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      desc: 'Falla encontrada + costo total',
    },
    {
      key: 'listo',
      title: '¡Listo para Retiro!',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      desc: 'Aviso de reparación terminada + saldo',
    },
    {
      key: 'repuestos',
      title: 'Espera de Repuestos',
      icon: <Clock className="w-4 h-4 text-purple-400" />,
      desc: 'Informa demora por piezas',
    },
    {
      key: 'recordatorio',
      title: 'Recordatorio de Retiro',
      icon: <AlertTriangle className="w-4 h-4 text-error" />,
      desc: 'Para equipos listos sin retirar',
    },
    {
      key: 'personalizado',
      title: 'Mensaje Libre / Editado',
      icon: <Edit3 className="w-4 h-4 text-blue-400" />,
      desc: 'Escribir texto personalizado',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f131a] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col font-sans">
        {/* Encabezado del Modal */}
        <div className="p-4 sm:p-5 bg-[#141923] border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
                CENTRO DE NOTIFICACIONES WHATSAPP
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Notificar a <span className="text-amber-400">{order.customer_name || 'Cliente'}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con 2 columnas (Plantillas y Previsualización) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto max-h-[75vh]">
          {/* COLUMNA IZQUIERDA: Selector de Plantilla y Teléfono */}
          <div className="lg:col-span-5 space-y-4">
            {/* Input de Teléfono */}
            <div className="bg-[#161c27] p-3.5 rounded-xl border border-white/5 space-y-2">
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono del Cliente
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: +54 9 11 1234-5678"
                className="w-full bg-[#0b0e14] border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 font-mono">
                Se formateará automáticamente para abrir WhatsApp.
              </p>
            </div>

            {/* Selector de Plantillas */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold block">
                Seleccionar Plantilla:
              </label>
              <div className="space-y-1.5">
                {templatesList.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => {
                      setSelectedTemplate(tpl.key);
                      setIsEditingCustom(tpl.key === 'personalizado');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      selectedTemplate === tpl.key
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm'
                        : 'bg-[#141923] border-white/5 text-slate-300 hover:bg-[#19202c] hover:border-white/10'
                    }`}
                  >
                    <div className="mt-0.5">{tpl.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>{tpl.title}</span>
                        {selectedTemplate === tpl.key && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Vista Previa WhatsApp Realista & Editor */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                  Vista Previa del Mensaje:
                </span>
                <button
                  onClick={() => setIsEditingCustom(!isEditingCustom)}
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {isEditingCustom ? 'Ver Formato Original' : 'Editar Texto'}
                </button>
              </div>

              {/* Burbuja Estilo WhatsApp */}
              <div className="bg-[#0b141a] border border-white/10 rounded-2xl p-4 sm:p-5 relative shadow-inner overflow-hidden">
                {/* Header falso de chat */}
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-3 mb-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                    {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs leading-none">
                      {order.customer_name || 'Cliente'}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      {phoneNumber || 'Sin teléfono'}
                    </div>
                  </div>
                </div>

                {/* Contenido del mensaje */}
                {isEditingCustom ? (
                  <textarea
                    rows={8}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Escribe tu mensaje personalizado aquí..."
                    className="w-full bg-[#111b21] border border-emerald-500/40 rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tr-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md font-sans border border-emerald-500/20 relative">
                    {currentMessage}
                    <div className="text-[10px] text-emerald-200/60 text-right mt-1.5 font-mono flex items-center justify-end gap-1">
                      <span>Ahora</span>
                      <Check className="w-3 h-3 text-emerald-300 inline" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Datos Resumen de la Orden */}
            <div className="bg-[#141923] p-3 rounded-xl border border-white/5 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">ORDEN</span>
                <span className="font-bold text-white">{order.tracking_code}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">TOTAL / SEÑA</span>
                <span className="font-bold text-white">
                  ${finalPrice.toLocaleString('es-AR')} / ${advancePayment.toLocaleString('es-AR')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">SALDO PENDIENTE</span>
                <span className={`font-bold ${pendingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {pendingBalance > 0 ? `$${pendingBalance.toLocaleString('es-AR')}` : 'Saldado ✓'}
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleOpenWhatsApp}
                disabled={!phoneNumber}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" /> Enviar por WhatsApp
              </button>

              <button
                onClick={handleCopyMessage}
                className="bg-[#161c27] hover:bg-[#1e2533] border border-white/10 text-white font-semibold text-xs py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
