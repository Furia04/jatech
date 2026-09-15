"use client";

import React, { useState } from "react";
import { CoreMode } from "@/types";
import { BackgroundCanvas } from "@/components/ui/BackgroundCanvas";
import { Navbar } from "@/components/sections/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { BentoGrid } from "@/components/sections/BentoGrid";
import { GestionTecnicosSection } from "@/components/sections/GestionTecnicosSection";
import { OperatorDossier } from "@/components/sections/OperatorDossier";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  const [activeCore, setActiveCore] = useState<CoreMode>("hardware");

  return (
    <main className="relative min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* Background with ultra-low CPU/GPU overhead */}
      <BackgroundCanvas activeCore={activeCore} />

      {/* Floating Navbar */}
      <Navbar activeCore={activeCore} setActiveCore={setActiveCore} />

      {/* Hero Section: Servicio Técnico & Impresión 3D vs Landing Pages & Software a Medida */}
      <HeroSection activeCore={activeCore} setActiveCore={setActiveCore} />

      {/* Bento Grid: Servicios con enfoque claro y amigable */}
      <BentoGrid activeCore={activeCore} />

      {/* Software de Taller / Gestión Técnicos */}
      <GestionTecnicosSection />

      {/* Equipo / Fichas de Técnicos (sin barras de progreso) */}
      <OperatorDossier />

      {/* Contacto Amigable con WhatsApp directo y formulario rápido (sin terminal) */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
