"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ThumbsUp,
} from "lucide-react";
import { CoreMode } from "@/types";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  activeCore: CoreMode;
  setActiveCore: (core: CoreMode) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeCore,
  setActiveCore,
}) => {
  const isHw = activeCore === "hardware";

  const coreData = {
    hardware: {
      badge: "DIAGNÓSTICO Y REPARACIÓN CONFIABLE",
      titlePrefix: "Servicio Técnico e",
      titleHighlight: "Impresiones 3D",
      subtitle:
        "Reparamos tus equipos con repuestos de calidad, diagnósticos claros y sin demoras innecesarias. Además, diseñamos y fabricamos piezas e impresiones 3D a tu medida con precios accesibles.",
      tags: [
        "Reparación de Notebooks y PC",
        "Diagnóstico Rápido y Honesto",
        "Garantía en Cada Trabajo",
        "Piezas 3D y Ventas al por Mayor",
      ],
      highlights: [
        { icon: Clock, title: "Reparación Rápida", desc: "Tiempos claros desde el primer día" },
        { icon: ShieldCheck, title: "Garantía Real", desc: "Respaldo en cada reparación y pieza" },
        { icon: ThumbsUp, title: "Precios Transparentes", desc: "Presupuesto sin sorpresas" },
      ],
      ctaPrimary: "Consultar por Reparación",
      ctaSecondary: "Ver Opciones 3D",
      primaryLink: "https://wa.me/5492645045411?text=Hola%20Jatech%2C%20tengo%20un%20equipo%20para%20reparar%20o%20consultar%20por%20impresi%C3%B3n%203D.",
    },
    software: {
      badge: "CRECIMIENTO DIGITAL PARA TU NEGOCIO",
      titlePrefix: "Landing Pages y",
      titleHighlight: "Software a Medida",
      subtitle:
        "Creamos páginas web que convierten visitas en clientes y desarrollamos software personalizado según tus necesidades. Sitios rápidos, atractivos y fáciles de usar desde cualquier celular.",
      tags: [
        "Páginas Web que Venden",
        "Diseño Adaptado a Celulares",
        "Sistemas a Medida de tu Negocio",
        "Soporte y Mantenimiento",
      ],
      highlights: [
        { icon: Zap, title: "Más Ventas", desc: "Diseño enfocado en captar clientes" },
        { icon: CheckCircle2, title: "Fácil de Administrar", desc: "Sin complicaciones técnicas" },
        { icon: Globe, title: "100% Personalizado", desc: "Hecho a la medida de tu negocio" },
      ],
      ctaPrimary: "Pedir Presupuesto Web",
      ctaSecondary: "Ver Diseños",
      primaryLink: "https://wa.me/5492645045411?text=Hola%20Jatech%2C%20quiero%20cotizar%20una%20landing%20page%20o%20desarrollo%20de%20software.",
    },
  };

  const current = isHw ? coreData.hardware : coreData.software;

  return (
    <section className="relative min-h-[85vh] pt-28 pb-16 flex flex-col justify-center items-center px-4 sm:px-6">
      {/* Selector: Servicio Técnico e Impresiones 3D vs Landing Pages y Software a Medida */}
      <div className="mb-8">
        <div className="p-1 rounded-2xl bg-[#0d0d1a] border border-white/10 flex flex-col sm:flex-row items-center gap-1">
          <button
            onClick={() => setActiveCore("hardware")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 min-h-[44px] w-full sm:w-auto justify-center",
              isHw
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Servicio Técnico e Impresiones 3D</span>
          </button>

          <button
            onClick={() => setActiveCore("software")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 min-h-[44px] w-full sm:w-auto justify-center",
              !isHw
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Globe className="w-4 h-4 text-violet-400" />
            <span>Landing Pages y Software a Medida</span>
          </button>
        </div>
      </div>

      {/* Main Hero Card with Dynamic Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCore}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto text-center flex flex-col items-center"
        >
          {/* Badge */}
          <div className="mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border",
                isHw
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  : "bg-violet-500/10 border-violet-500/30 text-violet-300"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isHw ? "bg-cyan-400" : "bg-violet-400"
                )}
              />
              {current.badge}
            </span>
          </div>

          {/* Monumental Clean Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            {current.titlePrefix}{" "}
            <span
              className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                isHw
                  ? "from-cyan-400 via-sky-300 to-blue-400"
                  : "from-violet-400 via-purple-300 to-cyan-400"
              )}
            >
              {current.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed mb-6">
            {current.subtitle}
          </p>

          {/* Practical Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl">
            {current.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-200 flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isHw ? "bg-cyan-400" : "bg-violet-400"
                  )}
                />
                {tag}
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-10">
            <a
              href={current.primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white transition-transform flex items-center justify-center gap-2.5 shadow-md",
                isHw
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
                "min-h-[48px] active:scale-[0.98]"
              )}
            >
              <span>{current.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#servicios"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm sm:text-base font-medium text-slate-300 hover:text-white bg-[#0e0e1a] border border-white/10 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              Conocer Todos los Servicios
            </a>
          </div>

          {/* Value Highlights (Clean, customer-oriented) */}
          <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-[#080812] border border-white/10">
            {current.highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-left"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg shrink-0",
                      isHw ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
