"use client";

import React from "react";
import { Cpu, Box, Globe, Wrench, Smartphone, MessageSquare } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const OperatorDossier: React.FC = () => {
  const team = [
    {
      id: "TEC-01",
      name: "Ignacio Ortiz",
      role: "Técnico en Informática & Desarrollador",
      division: "Reparación de Notebooks, Celulares e Impresoras",
      status: "DISPONIBLE EN TALLER",
      avatarIcon: Wrench,
      color: "cyan",
      bio: "Técnico en informática y desarrollador de software. Especialista a cargo del diagnóstico, mantenimiento y reparación de notebooks, computadoras, celulares e impresoras.",
      tags: ["Reparación de Notebooks", "Celulares y Smartphones", "Servicio de Impresoras", "Desarrollo de Software"],
    },
    {
      id: "TEC-02",
      name: "Pablo Cortez",
      role: "Diseñador 3D & Desarrollador",
      division: "Modelado, Impresión 3D & Software",
      status: "DISPONIBLE EN TALLER",
      avatarIcon: Box,
      color: "violet",
      bio: "Técnico en informática y desarrollador de software. A cargo del área de diseño y modelado 3D, fabricación de piezas a medida y creación de software personalizado.",
      tags: ["Diseño & Modelado 3D", "Impresión 3D a Medida", "Desarrollo de Software", "Técnico en Informática"],
    },
    {
      id: "TEC-03",
      name: "Facundo Santana",
      role: "Diseñador 3D & Desarrollador",
      division: "Impresión 3D, Software & Marketing",
      status: "DISPONIBLE ONLINE",
      avatarIcon: Globe,
      color: "emerald",
      bio: "Técnico en informática y desarrollador de software. A cargo del diseño e impresión 3D, desarrollo de sistemas web y estrategias de marketing digital y publicidad para negocios.",
      tags: ["Diseño e Impresión 3D", "Desarrollo Web & Software", "Marketing Digital & Ads", "Técnico en Informática"],
    },
  ];

  return (
    <section id="equipo" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <span className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          NUESTRO EQUIPO
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Atención Directa por{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400">
            Profesionales Especializados
          </span>
        </h2>
        <p className="text-slate-400 max-w-xl text-sm sm:text-base">
          Técnicos en Informática y Desarrolladores de Software comprometidos con darte la mejor
          atención, honestidad y soluciones definitivas.
        </p>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {team.map((member) => {
          const Icon = member.avatarIcon;
          const isCyan = member.color === "cyan";
          const isViolet = member.color === "violet";

          return (
            <SpotlightCard
              key={member.id}
              glowColor={isCyan ? "cyan" : isViolet ? "violet" : "emerald"}
              className="p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                {/* Profile Avatar & Info */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCyan
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : isViolet
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {member.name}
                    </h3>
                    <p
                      className={`text-xs font-medium ${
                        isCyan ? "text-cyan-300" : isViolet ? "text-violet-300" : "text-emerald-300"
                      }`}
                    >
                      {member.role}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.division}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                  {member.bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom direct consultation button */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Atención personalizada</span>
                <a
                  href={`https://wa.me/5492646211278?text=Hola%20${encodeURIComponent(member.name)}%20de%20Jatech%2C%20quisiera%20hacerte%20una%20consulta.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-semibold flex items-center gap-1.5 hover:underline ${
                    isCyan ? "text-cyan-300" : isViolet ? "text-violet-300" : "text-emerald-300"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Escribirle a {member.name.split(" ")[0]}
                </a>
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
};
