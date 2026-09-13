"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Menu, X, ArrowUpRight, MessageSquare, Instagram } from "lucide-react";
import { CoreMode } from "@/types";
import { cn } from "@/lib/utils";
import { JatechLogo } from "@/components/ui/JatechLogo";

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
        {/* Brand Name: Jatech */}
        <a href="#" className="flex items-center gap-2.5 focus:outline-none">
          <JatechLogo size="md" />
        </a>

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
        <div className="flex items-center gap-2.5">
          <a
            href="https://instagram.com/jatech_sj"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-white/5 border border-white/10 text-pink-400 hover:text-pink-300 hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Instagram @jatech_sj"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>

          <a
            href="https://wa.me/5492645045411?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 border border-white/20 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Consultar por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
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

            <div className="flex flex-col gap-2 mt-2">
              <a
                href="https://wa.me/5492645045411?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Directo
              </a>

              <a
                href="https://instagram.com/jatech_sj"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-pink-300 bg-pink-500/10 border border-pink-500/20 flex items-center justify-center gap-2"
              >
                <Instagram className="w-4 h-4" />
                Seguinos en Instagram (@jatech_sj)
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
