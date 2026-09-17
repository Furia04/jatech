'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import {
  Wrench,
  Smartphone,
  Laptop,
  Car,
  CheckCircle2,
  Printer,
  Search,
  ArrowRight,
  MessageSquare,
  Zap,
  Lock,
  User,
  ChevronRight,
  QrCode,
  ShieldCheck,
  Activity,
  Cpu,
  DollarSign,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const [heroMode, setHeroMode] = useState<'cliente' | 'tecnico'>('cliente');
  const [clientDniQuery, setClientDniQuery] = useState('');

  const handleClientSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientDniQuery.trim()) {
      router.push(`/GestionTecnicos/track?q=${encodeURIComponent(clientDniQuery.trim())}`);
    } else {
      router.push('/GestionTecnicos/track');
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. HEADER / NAVBAR DE INSTRUMENTACIÓN */}
      <header className="sticky top-0 bg-[#090b0e]/90 backdrop-blur-md border-b border-white/[0.08] z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
          <Link href="/GestionTecnicos" className="hover:opacity-95 transition-opacity">
            <Logo size={36} textSubtitle="Gestión de Servicio Técnico" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wide text-slate-400">
            <a href="#telemetria" className="hover:text-amber-400 transition-colors">
              // TELEMETRÍA
            </a>
            <a href="#multirubro" className="hover:text-amber-400 transition-colors">
              // MULTIRUBRO
            </a>
            <a href="#caracteristicas" className="hover:text-amber-400 transition-colors">
              // ESPECIFICACIONES
            </a>
            <a href="#planes" className="hover:text-amber-400 transition-colors">
              // PLAN ÚNICO
            </a>
          </nav>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/GestionTecnicos/login"
              className="text-slate-300 hover:text-white px-3 py-2 rounded transition-colors hidden sm:block border border-transparent hover:border-white/10"
            >
              Ingresar al Taller
            </Link>
            <Link
              href="/GestionTecnicos/demo"
              className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-semibold px-4 py-2 rounded transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Probar Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION CON REJILLA TÉCNICA Y SEGMENTED SWITCH */}
      <section className="relative pt-10 pb-16 px-6 overflow-hidden grid-pattern border-b border-white/[0.08]">
        {/* Glow sutil ámbar de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/[0.035] rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          
          {/* Selector Táctil Tipo Switch de Instrumentación */}
          <div className="inline-flex p-1 bg-[#141820] border border-white/[0.1] rounded-lg shadow-inner gap-1">
            <button
              onClick={() => setHeroMode('cliente')}
              className={`px-5 py-2 rounded text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                heroMode === 'cliente'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Modo Cliente
            </button>
            <button
              onClick={() => setHeroMode('tecnico')}
              className={`px-5 py-2 rounded text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                heroMode === 'tecnico'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Dueño de Taller
            </button>
          </div>

          {/* VISTA A: MODO "SOY CLIENTE" */}
          {heroMode === 'cliente' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                PORTAL PÚBLICO DE RASTREO TÉCNICO EN TIEMPO REAL
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
                ¿Dejaste tu equipo en el taller? <br />
                <span className="font-mono text-2xl sm:text-4xl text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20 inline-block mt-2">
                  Audita el avance sin intermediarios.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Ingresa tu DNI o código de orden (OT) para auditar el informe de falla, repuestos cotizados y aviso de retiro inmediato.
              </p>

              {/* Buscador de Alta Precisión OT */}
              <form
                onSubmit={handleClientSearchSubmit}
                className="max-w-xl mx-auto p-1.5 bg-[#12161f] border border-white/[0.12] rounded-lg shadow-2xl flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">OT#</span>
                  <input
                    type="text"
                    value={clientDniQuery}
                    onChange={(e) => setClientDniQuery(e.target.value)}
                    placeholder="Ingresa DNI o código OT (ej: 38912402)..."
                    className="w-full bg-[#090b0e] border border-white/[0.08] text-white rounded py-2.5 pl-12 pr-4 font-mono text-xs sm:text-sm focus:outline-none focus:border-amber-500/70 placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-semibold text-xs px-5 py-2.5 rounded transition-all shadow-sm flex items-center justify-center gap-1.5 font-mono whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5" /> Auditar Estado
                </button>
              </form>

              {/* Acceso Directo Secundario */}
              <div className="pt-2">
                <Link
                  href="/GestionTecnicos/track"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#12161f] border border-white/[0.08] hover:border-amber-500/40 rounded-lg text-slate-300 hover:text-white transition-all font-mono text-xs group"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Portal directo de consulta por documento</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* VISTA B: MODO "SOY TÉCNICO / DUEÑO DE TALLER" */}
          {heroMode === 'tecnico' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-[11px] font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                SOFTWARE DE BANCO DE TRABAJO PARA TALLERES EXIGENTES
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
                Control Operativo y Financiero para Talleres <br />
                <span className="font-mono text-2xl sm:text-4xl text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20 inline-block mt-2">
                  Multirubro de Alta Precisión.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Ingreso rápido de equipos, impresión térmica de <strong>80mm con QR directo</strong>, seguimiento público para tus clientes y control estricto de repuestos y margen neto.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono text-xs">
                <Link
                  href="/GestionTecnicos/register"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-semibold px-6 py-3 rounded transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Iniciar Prueba Gratuita 14 Días</span>
                  <Zap className="w-4 h-4" />
                </Link>
                <Link
                  href="/GestionTecnicos/demo"
                  className="w-full sm:w-auto bg-[#141820] border border-white/[0.1] text-slate-200 hover:text-white hover:bg-[#1a202c] px-6 py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>Inspeccionar Demo en Vivo</span>
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Operativo en 2 minutos</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Arquitectura multirubro</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. SIGNATURE SECTION: BKLIT UI WORKBENCH TELEMETRY & 80MM THERMAL TICKET */}
      <section id="telemetria" className="py-16 px-6 bg-[#0c0e13] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="font-mono text-xs text-amber-500 font-semibold tracking-wider uppercase mb-1">
                // COMPONENTES DE INSTRUMENTACIÓN (BKLIT.UI)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Telemetría en Vivo y Hardware en el Taller
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md font-mono">
              Diseñado para monitorear el pulso operativo de tu banco técnico sin hojas de cálculo desordenadas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CARD A: TELEMETRÍA DE RENDIMIENTO (BKLIT COMPOSABLE CHART STYLE) */}
            <div className="lg:col-span-7 bg-[#11141a] border border-white/[0.08] rounded-xl p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block">MÉTRICA OPERATIVA EN BANCO</span>
                  <h3 className="text-base font-bold text-white tracking-tight">Tiempo Medio de Diagnóstico & Carga Semanal</h3>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="w-3.5 h-3.5" />
                  <span>98.2% ENTREGAS A TIEMPO</span>
                </div>
              </div>

              {/* Composable Bklit Bar Graph Specimen */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-3xl font-bold text-white tracking-tight">
                    4.2 <span className="text-sm font-normal text-slate-400">horas</span>
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    Promedio histórico de resolución
                  </div>
                </div>

                {/* Simulated Bklit Responsive Histogram */}
                <div className="h-28 flex items-end gap-2 pt-3 pb-1">
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/20 group-hover:bg-amber-500/40 rounded-t h-[45%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">LUN</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/20 group-hover:bg-amber-500/40 rounded-t h-[65%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">MAR</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/20 group-hover:bg-amber-500/40 rounded-t h-[50%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">MIÉ</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/30 group-hover:bg-amber-500/50 rounded-t h-[80%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">JUE</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/30 group-hover:bg-amber-500/50 rounded-t h-[70%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">VIE</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500/25 group-hover:bg-amber-500/45 rounded-t h-[40%] transition-colors"></div>
                    <span className="font-mono text-[10px] text-slate-500">SÁB</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-amber-500 rounded-t h-[92%] transition-colors relative">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[9px] text-amber-400 bg-black px-1.5 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                        Hoy
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-amber-400 font-bold">HOY</span>
                  </div>
                </div>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] font-mono text-xs">
                <div className="bg-[#151922] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">EN BANCO ACTIVO</span>
                  <span className="text-white font-bold text-sm">18 Equipos</span>
                </div>
                <div className="bg-[#151922] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">ESPERA REPUESTOS</span>
                  <span className="text-amber-400 font-bold text-sm">4 Órdenes</span>
                </div>
                <div className="bg-[#151922] p-3 rounded-lg border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">LISTOS PARA ENTREGA</span>
                  <span className="text-emerald-400 font-bold text-sm">7 Listos</span>
                </div>
              </div>
            </div>

            {/* CARD B: MOCKUP REALISTA DE COMANDA TÉRMICA 80MM */}
            <div className="lg:col-span-5 bg-[#11141a] border border-white/[0.08] rounded-xl p-6 space-y-4">
              
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest block">HARDWARE NATIVO</span>
                  <h3 className="text-base font-bold text-white tracking-tight">Comanda Térmica 80mm</h3>
                </div>
                <span className="font-mono text-[10px] text-slate-400 bg-white/[0.05] px-2 py-1 rounded border border-white/10">
                  ESC/POS 203 DPI
                </span>
              </div>

              {/* TICKET PAPEL CON PERFORACIÓN Y FUENTE MONOESPACIADA */}
              <div className="bg-[#fafbfc] text-slate-900 p-5 rounded-lg shadow-xl font-mono text-xs leading-relaxed border border-slate-300 relative overflow-hidden">
                <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                  <div className="font-bold text-sm tracking-wider">TALLER ELECTRÓNICA & TECH</div>
                  <div className="text-[10px] text-slate-600">ORDEN DE TRABAJO: #OT-2026-0941</div>
                  <div className="text-[9px] text-slate-500">FECHA: 02/09/2026 - 18:30 HS</div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">CLIENTE:</span>
                    <span className="font-bold">GARCÍA, MARTÍN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">DNI / DOC:</span>
                    <span className="font-bold">38.912.402</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">EQUIPO:</span>
                    <span className="font-bold">MacBook Pro M2 14"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">FALLA:</span>
                    <span className="font-semibold text-[10px]">No enciende / Corto 19V</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-400 pt-1.5 mt-2">
                    <span className="text-slate-700 font-bold">PRESUPUESTO EST.:</span>
                    <span className="font-bold text-xs">$ 45.000 ARS</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded p-1">
                      <QrCode className="w-full h-full" />
                    </div>
                    <div>
                      <span>Escanea con tu cámara</span><br/>
                      <strong className="text-slate-900">track.sat.com/38912402</strong>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Emite comprobantes con código de barras y QR para el cliente y una copia adhesiva para identificar el chasis del equipo en el banco de trabajo.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SHOWCASE MULTIRUBRO COMO FICHA TÉCNICA */}
      <section id="multirubro" className="py-20 px-6 bg-[#090b0e] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="font-mono text-xs text-amber-500 font-semibold tracking-widest uppercase">
              // ARQUITECTURA DINÁMICA JSONB
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Adaptado a Cualquier Rubro Técnico
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              No limites tu taller a formularios rígidos de celulares. Define atributos de ingeniería y campos específicos para cada categoría de dispositivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { 
                title: 'Celulares & Tablets', 
                icon: Smartphone, 
                code: 'RUBRO-01',
                fields: ['IMEI / Serie', 'Patrón de Desbloqueo', 'Salud Batería', 'Tapa Trasera'] 
              },
              { 
                title: 'PC & Laptops', 
                icon: Laptop, 
                code: 'RUBRO-02',
                fields: ['Cargador Incluido', 'Contraseña OS', 'Capacidad RAM', 'Serial Motherboard'] 
              },
              { 
                title: 'Electrónica General', 
                icon: Wrench, 
                code: 'RUBRO-03',
                fields: ['Voltaje / Amperaje', 'Fórmula de Placa', 'Componentes IC', 'Lectura Bobinas'] 
              },
              { 
                title: 'Automotores / ECUs', 
                icon: Car, 
                code: 'RUBRO-04',
                fields: ['Kilometraje', 'Código VIN / Chasis', 'Escaneo OBD2', 'Número Patente'] 
              },
              { 
                title: 'Drones & Consolas', 
                icon: Cpu, 
                code: 'RUBRO-05',
                fields: ['Horas de Vuelo', 'Firmware Version', 'Joysticks', 'Serial Batería'] 
              },
            ].map((cat, i) => {
              const IconComponent = cat.icon;
              return (
                <div
                  key={i}
                  className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group hover:bg-[#151922]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{cat.code}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {cat.title}
                      </h3>
                      <div className="h-0.5 w-6 bg-amber-500/40 mt-1.5 mb-3 group-hover:w-12 transition-all"></div>
                    </div>

                    <ul className="space-y-1.5 font-mono text-[11px] text-slate-400">
                      {cat.fields.map((f, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-amber-500/70" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CARACTERÍSTICAS DE INGENIERÍA */}
      <section id="caracteristicas" className="py-24 px-6 bg-[#0c0e13] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="font-mono text-xs text-amber-500 font-semibold tracking-widest uppercase">
              // ESPECIFICACIONES DEL SISTEMA
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Herramientas Diseñadas por Técnicos para Técnicos
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Cada funcionalidad responde a un desafío real en el mostrador y en el banco de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Comanda Térmica 80mm & Hojas A4
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Emite tickets de recepción al instante en formato térmico para mostrador o comprobantes de entrega en hojas A4 con cláusulas legales y firma digital.
              </p>
            </div>

            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Portal Público por DNI o Código OT
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Elimina las interrupciones telefónicas: tus clientes consultan en vivo el estado exacto de su equipo introduciendo su documento o código de comanda.
              </p>
            </div>

            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Plantillas Directas de WhatsApp
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Comunica presupuestos y avisos de "Listo para Retirar" con un solo clic mediante mensajes parametrizados con los datos de la orden.
              </p>
            </div>

            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Bloqueo Financiero por Roles (RBAC)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Los técnicos asignados visualizan la orden y los repuestos requeridos sin exponer los costos de compra del taller ni la ganancia neta.
              </p>
            </div>

            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Presupuestador de Repuestos & Stock
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Descuenta automáticamente componentes del inventario al asignar repuestos a la orden, calculando márgenes de mano de obra en segundos.
              </p>
            </div>

            <div className="bg-[#11141a] border border-white/[0.08] hover:border-amber-500/30 p-6 rounded-xl space-y-3 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Aislamiento Multi-tenant con RLS
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Seguridad de datos mediante Row Level Security en Supabase: la información de tu taller, clientes y finanzas está 100% aislada.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. PLAN ÚNICO PLAN TALLER PRO ($20.000 / MES) */}
      <section id="planes" className="py-24 px-6 bg-[#090b0e] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          
          <div className="space-y-2">
            <span className="font-mono text-xs text-amber-500 uppercase tracking-widest font-semibold">
              // PRECIO CLARO Y SIN SORPRESAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Un Solo Plan con Todo Incluido
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-mono">
              Sin límites arbitrarios de órdenes ni cargos ocultos por funciones clave.
            </p>
          </div>

          <div className="bg-[#11141a] border border-amber-500/40 rounded-2xl p-8 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden text-left max-w-xl mx-auto">
            
            <div className="absolute top-0 right-0 bg-amber-500 text-black font-mono text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              PLAN INTEGRAL
            </div>

            <div className="space-y-3 border-b border-white/[0.08] pb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Plan Taller Pro
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Acceso completo a todas las herramientas operativas, financieras y de clientes para tu taller.
              </p>
              <div className="pt-2 flex items-baseline gap-2">
                <span className="font-mono text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  $20.000
                </span>
                <span className="font-mono text-xs text-slate-400">
                  ARS / mes
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[11px] text-amber-500 uppercase font-semibold tracking-wider">
                QUÉ INCLUYE TU SUSCRIPCIÓN:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Órdenes ilimitadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Control de stock e insumos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rubros 100% dinámicos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Portal público por DNI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Comandas 80mm & A4</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Plantillas WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/GestionTecnicos/register"
                className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-semibold font-mono text-xs py-3.5 rounded-lg transition-all text-center block shadow-sm flex items-center justify-center gap-2"
              >
                <span>Comenzar Prueba Gratuita de 14 Días</span>
                <Zap className="w-4 h-4" />
              </Link>
              <p className="text-center font-mono text-[10px] text-slate-500 mt-2.5">
                Sin tarjeta de crédito • Cancela cuando quieras
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER TÉCNICO */}
      <footer className="bg-[#090b0e] py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 font-mono">
          <Logo size={28} />

          <p>© 2026 JaTech. Software de Precisión para Servicio Técnico.</p>

          <div className="flex gap-6">
            <Link href="/GestionTecnicos/terms" className="hover:text-amber-400 transition-colors">Términos de Servicio</Link>
            <Link href="/GestionTecnicos/privacy" className="hover:text-amber-400 transition-colors">Privacidad</Link>
            <a href="#" className="hover:text-amber-400 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
