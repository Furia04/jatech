"use client";

import React from "react";
import { Cpu, Globe, CheckCircle2, UserCheck, MessageSquare } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const OperatorDossier: React.FC = () => {
  const team = [
    {
      id: "TEC-01",
      name: "Alex",
      role: "Especialista en Hardware & Servicio Técnico",
      division: "Diagnóstico de Equipos & Impresión 3D",
      status: "DISPONIBLE EN TALLER",
      avatarIcon: Cpu,
      color: "cyan",
      bio: "Apasionado por encontrar la solución a problemas complejos de hardware. Reparaciones cuidadas al detalle, diagnósticos sinceros y asesoramiento claro para cada cliente.",
      tags: ["Reparación de Notebooks y PC", "Microelectrónica", "Modelado e Impresión 3D"],
    },
    {
      id: "TEC-02",
      name: "Elena",
      role: "Desarrolladora Web & Sistemas",
      division: "Landing Pages & Software a Medida",
      status: "DISPONIBLE ONLINE",
      avatarIcon: Globe,
      color: "violet",
      bio: "Especialista en diseñar páginas y sistemas digitales rápidos, intuitivos y diseñados para que tu negocio venda más sin complicaciones innecesarias.",
      tags: ["Landing Pages", "Diseño Responsivo", "Software a Medida"],
    },
  ];

  return (
    <section id="equipo" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <span className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          NUESTRO EQUIPO
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Atención Directa y{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
            Profesionales Dedicados
          </span>
        </h2>
        <p className="text-slate-400 max-w-xl text-sm sm:text-base">
          En Jatech no hablás con un contestador automático. Te atendemos nosotros mismos y te
          acompañamos en todo el proceso.
        </p>
      </div>

      {/* Team Cards (Without loading/skill bars) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((member) => {
          const Icon = member.avatarIcon;
          const isCyan = member.color === "cyan";

          return (
            <SpotlightCard
              key={member.id}
              glowColor={isCyan ? "cyan" : "violet"}
              className="p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                {/* Header Status */}
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-white/[0.08] text-xs font-mono">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {member.status}
                  </span>
                  <span className="text-slate-400">{member.id}</span>
                </div>

                {/* Profile Avatar & Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isCyan
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-violet-500/10 border-violet-500/30 text-violet-400"
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {member.name}
                    </h3>
                    <p className={`text-xs font-medium ${isCyan ? "text-cyan-300" : "text-violet-300"}`}>
                      {member.role}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.division}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5">
                  {member.bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom direct consultation button */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs text-slate-400">Trato directo y transparente</span>
                <a
                  href={`https://wa.me/5491100000000?text=Hola%20${member.name}%20de%20Jatech%2C%20quisiera%20hacerte%20una%20consulta.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-semibold flex items-center gap-1.5 hover:underline ${
                    isCyan ? "text-cyan-300" : "text-violet-300"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Escribirle a {member.name}
                </a>
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
};
