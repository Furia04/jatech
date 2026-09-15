"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  QrCode,
  Printer,
  Package,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Search,
  Zap,
  Cpu,
  Laptop,
  Smartphone,
} from "lucide-react";

export const GestionTecnicosSection: React.FC = () => {
  const features = [
    {
      icon: QrCode,
      title: "Trazabilidad con QR & DNI",
      description: "Tus clientes consultan en vivo el estado del equipo desde cualquier dispositivo sin necesidad de llamar al taller.",
      badge: "CLIENT TRACKING",
    },
    {
      icon: Printer,
      title: "Ticketera Térmica 80mm / 58mm",
      description: "Emisión de comprobantes y comandas físicas con patrón de desbloqueo, fallas reportadas y términos legales.",
      badge: "HARDWARE READY",
    },
    {
      icon: Package,
      title: "Control de Stock & Repuestos",
      description: "Asignación de insumos por orden de trabajo, cálculo automático de costo, margen de ganancia y stock crítico.",
      badge: "INVENTORY",
    },
    {
      icon: MessageSquare,
      title: "Plantillas de WhatsApp en 1 Clic",
      description: "Notificaciones automáticas con mensaje dinámico para aviso de ingreso, presupuesto o equipo listo para retirar.",
      badge: "COMUNICACIÓN",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Técnico & Seguridad",
      description: "Roles diferenciados (dueño, técnico, admin), control de caja diaria y resguardo encriptado en la nube con Supabase.",
      badge: "ENTERPRISE",
    },
    {
      icon: Zap,
      title: "Cobros & Suscripción Integrada",
      description: "Pasarela lista con Mercado Pago, sin configuraciones complejas y activación automática al instante.",
      badge: "FINTECH",
    },
  ];

  return (
    <section id="gestion-tecnicos" className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto z-10">
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-amber-500/10 via-violet-600/10 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider uppercase text-amber-300 bg-amber-500/10 border border-amber-500/25 shadow-sm">
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Ecosistema JATECH // Software de Taller</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Gestión Técnica de Alto Rendimiento{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
            para Talleres & Laboratorios
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
          Centralizá diagnósticos, trazabilidad de clientes, impresión de comandas térmicas y control financiero en una plataforma web ultrarrápida diseñada exclusivamente para técnicos de reparación.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative p-6 rounded-2xl bg-[#0b0c16]/80 border border-white/[0.08] hover:border-amber-500/40 hover:bg-[#0f101f] transition-all duration-300 backdrop-blur-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-semibold text-base text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/[0.04] flex items-center gap-1 text-[11px] font-mono text-amber-400/80">
                <span>Operatividad 100% cloud</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-amber-500/30 bg-gradient-to-b from-[#111224] to-[#080912] shadow-2xl"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              // ACCESO INMEDIATO AL SISTEMA
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              ¿Tenés un taller o sos cliente y querés ver tu orden?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ingresá al panel de administración técnica de JATECH o consultá el estado de reparación de tu notebook, celular o equipo en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 font-sans">
            <a
              href="/GestionTecnicos/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-black" />
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </a>

            <a
              href="/GestionTecnicos/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Rastrear mi Reparación</span>
            </a>

            <a
              href="/GestionTecnicos/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-amber-300/90 hover:text-amber-300 transition-colors"
            >
              <span>Registrar Taller</span>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
