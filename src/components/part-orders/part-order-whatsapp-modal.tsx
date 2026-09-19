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
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { PartOrder, Shop } from '@/types';

export type PartOrderTemplateKey = 'arrived' | 'ordered' | 'ready_pickup' | 'custom';

interface PartOrderWhatsAppModalProps {
  order: PartOrder;
  shop?: Shop | null;
  onClose: () => void;
  defaultTemplate?: PartOrderTemplateKey;
}

export function PartOrderWhatsAppModal({
  order,
  shop,
  onClose,
  defaultTemplate = 'arrived',
}: PartOrderWhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PartOrderTemplateKey>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(order.customer_phone || '');
  const [copied, setCopied] = useState(false);

  const shopName = shop?.name || 'Nuestro Taller';
  const expectedPrice = order.expected_price || 0;
  const advancePayment = order.advance_payment || 0;
  const pendingBalance = Math.max(0, expectedPrice - advancePayment);

  // Formatear textos con variables dinámicas
  const getTemplateText = (templateKey: PartOrderTemplateKey): string => {
    const customerName = order.customer_name || 'Estimado/a cliente';
    const partName = order.part_name || 'su repuesto';
    const deviceModel = order.device_model ? ` (${order.device_model})` : '';

    switch (templateKey) {
      case 'arrived':
        return (
          `📦 ¡Hola ${customerName}! Te avisamos desde *${shopName}* que ya *LLEGÓ EL REPUESTO* que encargaste:\n\n` +
          `🔧 *Repuesto:* ${partName}${deviceModel}\n` +
          (expectedPrice > 0
            ? `💵 *Precio acordado:* $${expectedPrice.toLocaleString('es-AR')}\n`
            : '') +
          (advancePayment > 0
            ? `💰 *Seña previa:* $${advancePayment.toLocaleString('es-AR')}\n` +
              `💳 *Saldo a abonar:* $${pendingBalance.toLocaleString('es-AR')}\n`
            : '') +
          (pendingBalance === 0 && expectedPrice > 0
            ? `✅ *Estado de pago:* Totalmente abonado / Saldado.\n`
            : '') +
          `\n📍 ¡Ya podés acercarte a nuestro taller para retirarlo o traer tu equipo para la instalación!\n` +
          `Te esperamos en nuestros horarios habituales.`
        );

      case 'ordered':
        return (
          `🛒 ¡Hola ${customerName}! Te confirmamos desde *${shopName}* que ya solicitamos y *ENCARGAMOS TU REPUESTO* al distribuidor:\n\n` +
          `🔧 *Repuesto:* ${partName}${deviceModel}\n` +
          (advancePayment > 0
            ? `💰 *Seña recibida:* $${advancePayment.toLocaleString('es-AR')}\n`
            : '') +
          (expectedPrice > 0
            ? `💵 *Precio final estimado:* $${expectedPrice.toLocaleString('es-AR')}\n`
            : '') +
          `\n⏱️ Apenas arribe a nuestro taller te avisaremos de inmediato por este medio para coordinar la entrega o colocación.\n` +
          `¡Muchas gracias por confiar en nosotros!`
        );

      case 'ready_pickup':
        return (
          `🔔 ¡Hola ${customerName}! Te recordamos desde *${shopName}* que tu repuesto *${partName}* se encuentra disponible para entrega o colocado en el taller.\n\n` +
          (pendingBalance > 0
            ? `💰 *Saldo pendiente:* $${pendingBalance.toLocaleString('es-AR')}\n`
            : '') +
          `Quedamos a tu entera disposición ante cualquier consulta. ¡Te esperamos!`
        );

      case 'custom':
        return (
          customMessage ||
          `Hola ${customerName}, te escribimos de ${shopName} por el pedido de ${partName}.`
        );
    }
  };

  const currentMessage = isEditingCustom ? customMessage : getTemplateText(selectedTemplate);

  useEffect(() => {
    setCustomMessage(getTemplateText(selectedTemplate));
  }, [selectedTemplate]);

  // Limpiar y normalizar número de teléfono para wa.me
  const cleanPhoneForUrl = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, '');
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

  const templatesList: {
    key: PartOrderTemplateKey;
    title: string;
    icon: React.ReactNode;
    desc: string;
    color: string;
  }[] = [
    {
      key: 'arrived',
      title: '¡Repuesto Llegó al Taller!',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      desc: 'Aviso de arribo + saldo pendiente + invitación a retirar',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    {
      key: 'ordered',
      title: 'Repuesto Encargado',
      icon: <Truck className="w-4 h-4 text-cyan-400" />,
      desc: 'Confirmación de encargo al proveedor + seña',
      color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    },
    {
      key: 'ready_pickup',
      title: 'Recordatorio de Retiro',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      desc: 'Aviso para retirar repuesto en taller',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      key: 'custom',
      title: 'Mensaje Personalizado',
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      desc: 'Escribí tu propio mensaje libre',
      color: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                Aviso por WhatsApp
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Directo
                </span>
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Notificá al cliente sobre el estado de su repuesto encargado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Pedido */}
        <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-on-surface">
            <User className="w-4 h-4 text-primary" />
            <span className="font-semibold">{order.customer_name}</span>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant font-mono">
            <Package className="w-4 h-4 text-cyan-400" />
            <span className="text-on-surface font-medium">{order.part_name}</span>
            {order.device_model && (
              <span className="text-slate-400 text-[11px]">({order.device_model})</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {advancePayment > 0 && (
              <span className="text-emerald-400 font-mono">
                Seña: ${advancePayment.toLocaleString('es-AR')}
              </span>
            )}
            {pendingBalance > 0 && (
              <span className="text-amber-400 font-bold font-mono">
                Resta: ${pendingBalance.toLocaleString('es-AR')}
              </span>
            )}
          </div>
        </div>

        {/* Contenido Modal */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Teléfono Destinatario */}
          <div>
            <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-1.5 font-bold">
              Número de WhatsApp del Cliente
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: 2646211278 o 549264..."
                className="w-full pl-9 pr-3 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-sm text-on-surface font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Selector de Plantillas */}
          <div>
            <label className="block font-label-caps text-xs text-on-surface-variant uppercase mb-2 font-bold">
              Seleccionar Plantilla de Mensaje
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templatesList.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tpl.key);
                    setIsEditingCustom(tpl.key === 'custom');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    selectedTemplate === tpl.key
                      ? tpl.color
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{tpl.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface leading-tight">{tpl.title}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                      {tpl.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vista Previa y Edición del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">
                Mensaje a Enviar
              </label>
              <button
                type="button"
                onClick={() => setIsEditingCustom(!isEditingCustom)}
                className="text-xs text-primary hover:underline font-medium"
              >
                {isEditingCustom ? 'Ver plantilla automática' : 'Editar texto manualmente'}
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={7}
                value={currentMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setIsEditingCustom(true);
                }}
                className="w-full p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface font-mono leading-relaxed focus:outline-none focus:border-primary resize-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Acciones de Pie */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-high/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-highest text-xs font-semibold text-on-surface flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-highest text-xs font-semibold text-on-surface-variant transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Abrir en WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
