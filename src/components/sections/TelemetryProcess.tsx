"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Wrench,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  Zap,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { NeonBadge } from "@/components/ui/NeonBadge";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const TelemetryProcess: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Diagnóstico Forense",
      subtitle: "Inspección no destructiva",
      description:
        "Análisis térmico infrarrojo, mapeo de consumo en líneas de poder, osciloscopio digital y auditoría profunda de arquitectura de software.",
      icon: Search,
      tag: "FASE TELEMETRÍA",
      color: "cyan",
    },
    {
      number: "02",
      title: "Ingeniería & Rework",
      subtitle: "Intervención de precisión",
      description:
        "Micro-soldadura quirúrgica BGA, reemplazo de integrados SMD, modelado 3D CAD o codificación en Next.js con TypeScript estricto.",
      icon: Wrench,
      tag: "FASE FABRICACIÓN",
      color: "violet",
    },
    {
      number: "03",
      title: "Stress-Test & QA",
      subtitle: "Validación extrema",
      description:
        "Pruebas de carga sostenida a máxima temperatura, telemetría de red 10Gbps, testing end-to-end y auditoría de seguridad perimetral.",
      icon: CheckCircle2,
      tag: "FASE VALIDACIÓN",
      color: "emerald",
    },
    {
      number: "04",
      title: "Despliegue & Garantía",
      subtitle: "Entrega llave en mano",
      description:
        "Emisión de informe técnico detallado de laboratorio, puesta en producción cloud o entrega de hardware protegido con garantía por escrito.",
      icon: Rocket,
      tag: "FASE FINAL",
      color: "cyan",
    },
  ];

  const metrics = [
    {
      id: "m-1",
      value: 99.8,
      decimals: 1,
      suffix: "%",
      label: "Eficiencia de Diagnóstico",
      sublabel: "Identificación certera de falla en primera instancia",
      color: "text-cyan-400",
    },
    {
      id: "m-2",
      value: 500,
      prefix: "+",
      label: "Equipos y Placas Recuperadas",
      sublabel: "Hardware crítico rescatado de descarte definitivo",
      color: "text-violet-400",
    },
    {
      id: "m-3",
      value: 24,
      prefix: "<",
      suffix: "h",
      label: "Tiempo Promedio de Respuesta",
      sublabel: "Diagnóstico preliminar y plan de acción emitido",
      color: "text-emerald-400",
    },
    {
      id: "m-4",
      value: 100,
      suffix: "%",
      label: "Proyectos Llave en Mano",
      sublabel: "Documentación, código fuente o reporte forense completo",
      color: "text-blue-400",
    },
  ];

  return (
    <section id="proceso" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <NeonBadge variant="emerald" prefixCode="SYS-PIPELINE" pulse className="mb-4">
          METODOLOGÍA DE INGENIERÍA Y TELEMETRÍA
        </NeonBadge>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Protocolo Operativo de{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
            Cuatro Fases
          </span>
        </h2>
        <p className="text-slate-400 max-w-2xl text-base sm:text-lg">
          Sin improvisaciones. Cada servicio técnico y desarrollo de software sigue un pipeline de
          calidad trazable con métricas en tiempo real.
        </p>
      </div>

      {/* Pipeline Step-by-Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <SpotlightCard
              key={step.number}
              glowColor={step.color as "cyan" | "violet" | "emerald"}
              className="p-6 sm:p-7 flex flex-col justify-between relative group"
            >
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="font-mono text-3xl font-black text-white/30 group-hover:text-white/70 transition-colors">
                    {step.number}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-slate-400">
                    {step.tag}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5 group-hover:border-cyan-400/40 transition-colors">
                  <Icon className="w-6 h-6 text-cyan-300" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mb-3">{step.subtitle}</p>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PROTOCOLO ACTIVO
                </span>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Metrics Banner with Animated Counters */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#080814]/90 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase block mb-1">
                TELEMETRÍA EN TIEMPO REAL
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Métricas Consolidadas de Rendimiento
              </h3>
            </div>
            <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              DATOS AUDITADOS EN PRODUCCIÓN
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2 text-white">
                  <AnimatedCounter
                    value={metric.value}
                    decimals={metric.decimals}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                    className={metric.color}
                  />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  {metric.label}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {metric.sublabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
