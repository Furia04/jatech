"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Send,
  MessageSquare,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  CornerDownLeft,
} from "lucide-react";
import { NeonBadge } from "@/components/ui/NeonBadge";
import { cn } from "@/lib/utils";

export const ContactTerminal: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [logs, setLogs] = useState<Array<{ type: "system" | "user" | "success" | "warn"; text: string }>>([
    { type: "system", text: "NEXUS CORE CLI v2.4.9 initialized on secure gateway." },
    { type: "system", text: "Escribe 'help' o pulsa los botones de acceso directo para coordinar." },
    { type: "success", text: "CANAL ENCRIPTADO DISPONIBLE // OPERADORES ACTIVOS." },
  ]);

  // Web Audio API subtle synth beeps for cyber micro-interactions
  const playCyberBeep = (freq = 880, duration = 0.08) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const triggerPulse = () => {
    setPulseActive(true);
    playCyberBeep(950, 0.12);
    setTimeout(() => setPulseActive(false), 500);
  };

  const handleCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    triggerPulse();
    const newLogs = [...logs, { type: "user" as const, text: `$ ${commandInput}` }];

    if (cmd === "help") {
      newLogs.push({
        type: "system",
        text: "Comandos disponibles: 'diagnostico', 'whatsapp', 'cita', 'status', 'clear'",
      });
    } else if (cmd === "diagnostico" || cmd === "diag") {
      newLogs.push({
        type: "success",
        text: "Iniciando protocolo de diagnóstico técnico. Redirigiendo a WhatsApp...",
      });
      window.open(
        "https://wa.me/5491100000000?text=Hola%20Nexus%20Core%2C%20requiero%20un%20diagn%C3%B3stico%20t%C3%A9cnico%20para%20un%20equipo%2Fproyecto.",
        "_blank"
      );
    } else if (cmd === "whatsapp" || cmd === "ws") {
      newLogs.push({
        type: "success",
        text: "Abriendo canal seguro directo de WhatsApp...",
      });
      window.open("https://wa.me/5491100000000", "_blank");
    } else if (cmd === "status") {
      newLogs.push({
        type: "system",
        text: "SYSTEM NOMINAL: Temperatura Lab 21°C | SLA 99.8% | Operadores Online",
      });
    } else if (cmd === "clear") {
      setLogs([]);
      setCommandInput("");
      return;
    } else {
      newLogs.push({
        type: "warn",
        text: `Comando desconocido: '${cmd}'. Escribe 'help' o usa los botones rápidos abajo.`,
      });
    }

    setLogs(newLogs);
    setCommandInput("");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText("NEXUS-LAB-AUTH-8829-X");
    setCopied(true);
    playCyberBeep(1200, 0.05);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="terminal" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto relative">
      <div className="flex flex-col items-center text-center mb-12">
        <NeonBadge variant="violet" prefixCode="CLI-GATEWAY" pulse className="mb-4">
          CONSOLA DE CONTACTO &amp; TELEMETRÍA
        </NeonBadge>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Conexión Directa con el{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400">
            Laboratorio Central
          </span>
        </h2>
        <p className="text-slate-400 max-w-xl text-sm sm:text-base">
          Elige tu vía de comunicación: inicia un chat inmediato por WhatsApp para urgencias de hardware
          o agenda una sesión de evaluación para desarrollo de software.
        </p>
      </div>

      {/* Main Terminal Window Frame */}
      <div
        className={cn(
          "rounded-3xl border bg-[#080812]/95 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all duration-300 relative",
          pulseActive
            ? "border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
            : "border-white/15"
        )}
      >
        {/* Terminal Title Bar */}
        <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
            <span className="ml-3 font-mono text-xs text-slate-400 hidden sm:inline">
              nexus-core@lab-terminal:~ (tty01)
            </span>
          </div>

          {/* Sound toggle & copy token */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              title="Alternar sonido háptico"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono text-[10px]">
                {soundEnabled ? "FX ON" : "FX OFF"}
              </span>
            </button>

            <button
              onClick={handleCopyHash}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "COPIADO" : "TOKEN SEC"}</span>
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="p-6 sm:p-8 font-mono text-xs sm:text-sm min-h-[220px] max-h-[300px] overflow-y-auto space-y-2.5 scanlines">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log.type === "system" && (
                <span className="text-slate-400">[SYSTEM] {log.text}</span>
              )}
              {log.type === "user" && (
                <span className="text-cyan-300 font-bold">{log.text}</span>
              )}
              {log.type === "success" && (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {log.text}
                </span>
              )}
              {log.type === "warn" && (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {log.text}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Terminal Input Line */}
        <form
          onSubmit={handleCommandSubmit}
          className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center gap-3"
        >
          <span className="text-cyan-400 font-mono text-sm font-bold flex items-center gap-1">
            <span>&gt;</span>
          </span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Escribe 'diagnostico', 'whatsapp', 'status' o 'clear'..."
            className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white border border-white/10 transition-colors"
            title="Ejecutar comando"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Cyber Actions Grid */}
        <div className="p-6 sm:p-8 bg-black/60 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: WhatsApp Directo */}
          <a
            href="https://wa.me/5491100000000?text=Hola%20Nexus%20Core%2C%20necesito%20coordinar%20un%20diagn%C3%B3stico%20t%C3%A9cnico%20urgente%20o%20presupuesto."
            target="_blank"
            rel="noopener noreferrer"
            onClick={triggerPulse}
            className={cn(
              "group p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between min-h-[52px]",
              "bg-gradient-to-r from-emerald-950/40 via-black to-emerald-950/20 border-emerald-500/30",
              "hover:border-emerald-400 hover:shadow-neon-emerald"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                  Iniciar Chat WhatsApp
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Respuesta media: &lt; 15 min en horario de lab
                </p>
              </div>
            </div>
            <Send className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Action 2: Agendar Diagnóstico / Reunión */}
          <a
            href="mailto:contacto@nexuscore.tech?subject=Solicitud%20de%20Diagnostico%20Tecnico%20Nexus%20Core&body=Detalle%20del%20equipo%20o%20proyecto%3A"
            onClick={triggerPulse}
            className={cn(
              "group p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between min-h-[52px]",
              "bg-gradient-to-r from-violet-950/40 via-black to-violet-950/20 border-violet-500/30",
              "hover:border-violet-400 hover:shadow-neon-violet"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base tracking-tight">
                  Agendar Evaluación Técnica
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Reunión virtual o ingreso al laboratorio
                </p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};
