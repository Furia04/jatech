"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Menu, X, ArrowUpRight, MessageSquare } from "lucide-react";
import { CoreMode } from "@/types";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activeCore: CoreMode;
  setActiveCore: (core: CoreMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeCore, setActiveCore }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Servicios", href: "#servicios" },
    { label: "Impresión 3D", href: "#impresion-3d" },
    { label: "Equipo", href: "#equipo" },
    { label: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3.5 sm:py-4 transition-all duration-200">
      <nav
        className={cn(
          "w-full max-w-5xl rounded-full transition-all duration-300",
          "backdrop-blur-md border flex items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5",
          scrolled
            ? "bg-[#050508]/90 border-white/10 shadow-lg"
            : "bg-[#0a0a14]/75 border-white/[0.08]"
        )}
      >
        {/* Brand Name: Jatech (Without 'Engineering lab') */}
        <a href="#" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-600/30 via-slate-900 to-cyan-500/30 border border-white/15 group-hover:border-cyan-400/50 transition-colors">
            <Cpu className="w-4 h-4 text-cyan-400 group-hover:text-violet-300 transition-colors" />
          </div>
          <span className="font-mono text-base sm:text-lg font-extrabold tracking-wide text-white">
            JATECH<span className="text-cyan-400">.</span>
          </span>
        </a>

        {/* Operational Status (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SISTEMA ONLINE // DISPONIBLE</span>
        </div>

        {/* Simple navigation links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-300 hover:text-white transition-colors py-1 focus:outline-none"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5491100000000?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 border border-white/20 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultar por WhatsApp</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir Menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="absolute top-16 left-4 right-4 bg-[#0a0a16]/95 border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 md:hidden z-50 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center justify-between"
                >
                  {link.label}
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>

            <a
              href="https://wa.me/5491100000000?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center gap-2 mt-2"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Directo
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
