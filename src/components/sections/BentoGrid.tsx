"use client";

import React from "react";
import {
  Wrench,
  Globe,
  Box,
  Wifi,
  Briefcase,
  Megaphone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  ArrowRight,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { CoreMode } from "@/types";

interface BentoGridProps {
  activeCore: CoreMode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ activeCore }) => {
  return (
    <section id="servicios" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-14">
        <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase mb-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          NUESTROS SERVICIOS
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Soluciones Claras y Confiables para{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">
            Personas y Empresas
          </span>
        </h2>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
          Nos enfocamos en darte respuestas rápidas, precios honestos y soluciones definitivas,
          sin vueltas ni tecnicismos confusos.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* CARD 1: SERVICIO TÉCNICO DE CONFIANZA (Lg: 7 cols) */}
        <SpotlightCard
          glowColor="cyan"
          className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                GARANTÍA EN CADA ARREGLO
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
              Servicio Técnico Rápido y Confiable
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Reparamos notebooks, PCs de escritorio, celulares, impresoras y placas electrónicas. Te explicamos
              con claridad qué problema tiene tu equipo, te pasamos un presupuesto justo y te lo
              devolvemos funcionando en el menor tiempo posible.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {[
                "Reparación de Notebooks, PCs y Celulares",
                "Mantenimiento y Arreglo de Impresoras",
                "Diagnóstico honesto sin costo oculto",
                "Repuestos de primera calidad garantizados",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">¿Tu equipo no enciende o anda lento?</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20tengo%20un%20equipo%20para%20reparar."
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 font-semibold hover:underline flex items-center gap-1"
            >
              Consultar por WhatsApp &rarr;
            </a>
          </div>
        </SpotlightCard>

        {/* CARD 2: LANDING PAGES & SOFTWARE A MEDIDA (Lg: 5 cols) */}
        <SpotlightCard
          glowColor="violet"
          className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                PENSADO PARA VENDER
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
              Landing Pages y Software a Medida
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Diseñamos páginas web y sistemas a la medida de tus requisitos. Tu negocio se verá
              profesional en cualquier celular y listo para recibir clientes todos los días.
            </p>

            <div className="space-y-2 mb-6">
              {[
                "Páginas de aterrizaje de alta conversión",
                "Carga instantánea en smartphones y computadoras",
                "Diseño moderno y adaptado a tu identidad",
                "Sistemas simples para gestionar tu negocio",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-slate-400">Páginas listas para vender</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quiero%20cotizar%20una%20p%C3%A1gina%20web%20o%20software."
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 font-semibold hover:underline flex items-center gap-1"
            >
              Cotizar mi Web &rarr;
            </a>
          </div>
        </SpotlightCard>

        {/* CARD 3: MARKETING DIGITAL (Lg: 6 cols) */}
        <SpotlightCard
          glowColor="violet"
          className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-pink-300 border border-white/10">
                MÁS CLIENTES Y VENTAS
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Marketing Digital & Publicidad Online
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Hacé crecer tu marca con campañas publicitarias efectivas en redes sociales y buscadores.
              Atraemos potenciales clientes interesados en tus productos o servicios listos para comprar.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                "Publicidad en Instagram & Facebook",
                "Campañas en Google Ads",
                "Estrategias de Conversión",
                "Posicionamiento de Marca",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-pink-300 font-medium">Llegá a tu público ideal</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20asesoramiento%20sobre%20Marketing%20Digital%20y%20publicidad."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Consultar Marketing &rarr;
            </a>
          </div>
        </SpotlightCard>

        {/* CARD 4: IMPRESIÓN 3D (Lg: 6 cols) */}
        <SpotlightCard
          id="impresion-3d"
          glowColor="default"
          className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Box className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-purple-300 border border-white/10">
                PRECIOS ACCESIBLES
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Impresión 3D y Piezas a Medida
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Fabricamos piezas plásticas a pedido, repuestos que ya no se consiguen y diseños
              personalizados. Venta por unidad y descuentos especiales en compras al por mayor.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {["Repuestos a Medida", "Venta al por Mayor", "Precios Accesibles", "Múltiples Colores"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-purple-300 font-medium">Minorista y Mayorista</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20cotizar%20un%20trabajo%20de%20impresi%C3%B3n%203D."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Pedir Presupuesto &rarr;
            </a>
          </div>
        </SpotlightCard>

        {/* CARD 5: REDES E INTERNET (Lg: 6 cols) */}
        <SpotlightCard
          glowColor="cyan"
          className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Wifi className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-blue-300 border border-white/10">
                WI-FI Y CABLEADO
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Redes e Internet sin Cortes
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Mejoramos la señal de Wi-Fi en tu casa, local u oficina para que no sufras cortes ni
              lentitud. Instalamos cableado prolijo y configuramos routers para una conexión estable.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {["Wi-Fi en toda la casa", "Cableado Prolijo", "Configuración Rápida", "Internet Seguro"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-blue-300 font-medium">Cobertura total</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20tengo%20problemas%20con%20mi%20conexi%C3%B3n%20o%20necesito%20instalar%20redes."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Consultar &rarr;
            </a>
          </div>
        </SpotlightCard>

        {/* CARD 6: SOPORTE PARA PYMES Y COMERCIOS (Lg: 6 cols) */}
        <SpotlightCard
          glowColor="emerald"
          className="lg:col-span-6 p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">
                SOPORTE DE CONFIANZA
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Soporte Tecnológico para Comercios y PyMEs
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Cuidamos las computadoras y sistemas de tu negocio. Respaldamos tus archivos y fotos
              importantes para que nunca los pierdas y te asistimos rápido cuando algo falle.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {["Copia de Seguridad", "Atención Rápida", "Mantenimiento Continuo", "Asesoría Cercana"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">Tranquilidad para tu negocio</span>
            <a
              href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20soporte%20t%C3%A9cnico%20para%20mi%20comercio%20o%20empresa."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Pedir Asesoría &rarr;
            </a>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
};
