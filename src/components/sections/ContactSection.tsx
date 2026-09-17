"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Phone, Send, CheckCircle2, Instagram } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "reparacion",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Direct open WhatsApp with formatted message
    const serviceName =
      formData.service === "reparacion"
        ? "Servicio Técnico"
        : formData.service === "impresion3d"
        ? "Impresión 3D"
        : formData.service === "web"
        ? "Página Web / Software"
        : formData.service === "marketing"
        ? "Marketing Digital / Publicidad"
        : formData.service === "redes"
        ? "Redes e Internet"
        : "Consulta General";

    const text = `Hola Jatech! Mi nombre es ${formData.name}. Me gustaría consultar por ${serviceName}. Detalle: ${formData.message}`;
    window.open(`https://wa.me/5492646211278?text=${encodeURIComponent(text)}`, "_blank");
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase mb-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          ATENCIÓN INMEDIATA
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          ¿En Qué Podemos{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400">
            Ayudarte Hoy?
          </span>
        </h2>
        <p className="text-slate-300 max-w-xl text-sm sm:text-base">
          Escribinos por WhatsApp o completá el formulario. Te respondemos rápido, con presupuestos
          claros y sin compromiso.
        </p>
      </div>

      {/* Main Friendly Contact Card */}
      <SpotlightCard glowColor="emerald" className="p-6 sm:p-10">
        {/* Direct WhatsApp Hero Banner */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                Atención Rápida por WhatsApp
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                La forma más rápida de consultar presupuestos y disponibilidad de reparación.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            Abrir Chat de WhatsApp
          </a>
        </div>

        {/* Friendly Consultation Form */}
        <div className="pt-2">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>O dejanos tu mensaje aquí y te contactamos:</span>
          </h4>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white mb-1">¡Mensaje Enviado!</h4>
              <p className="text-xs text-slate-300">
                Se ha abierto la conversación en WhatsApp. Te responderemos a la brevedad.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tu Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Martín Gómez"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ¿Qué servicio necesitás?
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    <option value="reparacion">Servicio Técnico (PC / Notebook / Celular / Impresora)</option>
                    <option value="impresion3d">Impresión 3D / Piezas a Medida</option>
                    <option value="web">Landing Page o Software a Medida</option>
                    <option value="marketing">Marketing Digital & Publicidad (Meta / Google Ads)</option>
                    <option value="redes">Redes e Internet Wi-Fi</option>
                    <option value="otro">Otro tipo de consulta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contanos brevemente qué te gustaría hacer o qué problema tiene tu equipo:
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ej: Mi notebook/impresora no funciona / Necesito imprimir piezas 3D / Quiero una web y campaña de publicidad..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Consulta Directa
              </button>
            </form>
          )}
        </div>

        {/* Contact info footer */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <a
            href="mailto:jatech.sj@gmail.com"
            className="flex items-center gap-2.5 hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4 text-violet-400 shrink-0" />
            <span>jatech.sj@gmail.com</span>
          </a>
          <a
            href="https://wa.me/5492646211278"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>264 621 1278 (WhatsApp)</span>
          </a>
          <a
            href="https://instagram.com/jatech_sj"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 hover:text-pink-300 transition-colors"
          >
            <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
            <span>@jatech_sj (Instagram)</span>
          </a>
        </div>
      </SpotlightCard>
    </section>
  );
};
