"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Menu,
  X,
  ArrowUpRight,
  MessageSquare,
  Instagram,
  Wrench,
  Store,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { CoreMode } from "@/types";
import { cn } from "@/lib/utils";

interface NavbarProps {
  activeCore?: CoreMode;
  setActiveCore?: (core: CoreMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeCore, setActiveCore }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [softwareDropdownOpen, setSoftwareDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSoftwareDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { 
      label: "Catálogo", 
      href: "/notebooks", 
      isActive: pathname?.startsWith("/notebooks") 
    },
    { 
      label: "Servicios", 
      href: isHome ? "#servicios" : "/#servicios", 
      isActive: false 
    },
    { 
      label: "Equipo", 
      href: isHome ? "#equipo" : "/#equipo", 
      isActive: false 
    },
    { 
      label: "Contacto", 
      href: isHome ? "#contacto" : "/#contacto", 
      isActive: false 
    },
  ];

  const isSoftwareActive = pathname?.startsWith("/GestionTecnicos") || pathname?.startsWith("/market");

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
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="logo-shimmer rounded-lg relative w-24 sm:w-28 h-8 sm:h-10">
            <img 
              src="/logo.png" 
              alt="Jatech Logo" 
              className="object-contain w-full h-full"
            />
          </div>
        </Link>

        {/* Navigation links con Desplegable Softwares */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-300">
          {/* Primeros links */}
          {navLinks.slice(0, 2).map((link) => {
            const isAnchor = link.href.startsWith("#");
            const className = cn(
              "transition-colors py-1 focus:outline-none",
              link.isActive
                ? "text-cyan-400 font-semibold"
                : "text-slate-300 hover:text-white"
            );

            if (isAnchor) {
              return (
                <a key={link.label} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            }

            return (
              <Link key={link.label} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}

          {/* Menú Desplegable: Softwares */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setSoftwareDropdownOpen(!softwareDropdownOpen)}
              onMouseEnter={() => setSoftwareDropdownOpen(true)}
              className={cn(
                "flex items-center gap-1.5 py-1 transition-colors focus:outline-none rounded-lg px-2",
                isSoftwareActive || softwareDropdownOpen
                  ? "text-cyan-400 font-semibold bg-white/5"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <span>Softwares</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200 text-slate-400",
                  softwareDropdownOpen && "rotate-180 text-cyan-400"
                )}
              />
            </button>

            {/* Dropdown flotante */}
            <AnimatePresence>
              {softwareDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onMouseLeave={() => setSoftwareDropdownOpen(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 rounded-2xl bg-[#0a0a16]/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Plataformas SaaS</span>
                    <span className="text-cyan-400 font-bold">JaTech Suite</span>
                  </div>

                  {/* Opción 1: Gestión Técnicos */}
                  <Link
                    href="/GestionTecnicos/login"
                    onClick={() => setSoftwareDropdownOpen(false)}
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-amber-500/20 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Gestión Técnicos
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Taller
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        SaaS para talleres de reparación, control de órdenes, clientes y stock.
                      </p>
                    </div>
                  </Link>

                  {/* Opción 2: JaTech Market */}
                  <Link
                    href="/market/login"
                    onClick={() => setSoftwareDropdownOpen(false)}
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-emerald-500/20 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          JaTech Market
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Supermercado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        Punto de Venta (POS), arqueo de cajas Z, stock pesable y tickets térmicos.
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resto de links */}
          {navLinks.slice(2).map((link) => {
            const isAnchor = link.href.startsWith("#");
            const className = cn(
              "transition-colors py-1 focus:outline-none",
              link.isActive
                ? "text-cyan-400 font-semibold"
                : "text-slate-300 hover:text-white"
            );

            if (isAnchor) {
              return (
                <a key={link.label} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            }

            return (
              <Link key={link.label} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
            href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 border border-white/20 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Consultar por WhatsApp</span>
            <span className="lg:hidden">WhatsApp</span>
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
              {navLinks.map((link) => {
                const isAnchor = link.href.startsWith("#");
                const className = cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors",
                  link.isActive
                    ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30"
                    : "text-slate-200 hover:bg-white/5"
                );

                if (isAnchor) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={className}
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={className}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>

            {/* Plataformas SaaS en Mobile */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
                Softwares & SaaS JaTech
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  href="/GestionTecnicos/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 hover:bg-amber-500/20 transition-all shadow-sm"
                >
                  <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold">Gestión Técnicos</span>
                    <span className="text-[10px] text-slate-400">Taller y Reparaciones</span>
                  </div>
                </Link>

                <Link
                  href="/market/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 hover:bg-emerald-500/20 transition-all shadow-sm"
                >
                  <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold">JaTech Market</span>
                    <span className="text-[10px] text-slate-400">Supermercado y POS</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Botones de Contacto en Mobile */}
            <div className="flex flex-col gap-2 mt-2">
              <a
                href="https://wa.me/5492646211278?text=Hola%20Jatech%2C%20quisiera%20hacer%20una%20consulta%20o%20pedir%20presupuesto."
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
