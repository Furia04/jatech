'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ShieldCheck, Lock, ArrowLeft, Eye, Database, Server, UserCheck, Key } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = '1 de Septiembre de 2026';

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      {/* Encabezado */}
      <header className="bg-surface-container border-b border-outline-variant py-4 px-6 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <Link href="/">
          <Logo size={36} textSubtitle="Software para técnicos" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest rounded-xl text-xs font-bold text-on-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-primary" /> Volver al Inicio
        </Link>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 space-y-10">
        <div className="space-y-3 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-label-caps text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Protección de Datos Personales
          </span>
          <h1 className="font-display-lg text-3xl md:text-5xl font-bold text-on-surface tracking-tight">
            Política de Privacidad
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
            Última actualización: <span className="font-bold text-on-surface">{lastUpdated}</span>
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 md:p-10 space-y-8 shadow-xl text-xs md:text-sm leading-relaxed text-on-surface-variant">
          {/* SECCIÓN 1 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Eye className="w-5 h-5 text-primary" /> 1. Información que Recopilamos
            </h2>
            <p>
              En <strong>JaTech</strong> recopilamos únicamente la información necesaria para prestar el servicio de gestión de talleres técnicos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Datos del Taller y Administrador:</strong> Nombre del negocio, correo electrónico, teléfono de WhatsApp y contraseña encriptada al registrar su cuenta.</li>
              <li><strong>Datos Operativos de Clientes y Equipos:</strong> Nombres de clientes, DNI/CUIT, teléfonos de contacto y características de los dispositivos ingresados al taller por el usuario.</li>
            </ul>
          </section>

          {/* SECCIÓN 2 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Database className="w-5 h-5 text-emerald-400" /> 2. Uso y Destino de la Información
            </h2>
            <p>
              La información recopilada se utiliza exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Permitir el funcionamiento del panel de control del taller y la emisión de comandas de 80mm.</li>
              <li>Habilitar la consulta en tiempo real para sus clientes finales mediante el portal público B2C por DNI o código OT.</li>
              <li>Enviar notificaciones de estado y recordatorios operativos vía WhatsApp cuando el usuario así lo disponga.</li>
            </ul>
          </section>

          {/* SECCIÓN 3 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Lock className="w-5 h-5 text-purple-400" /> 3. Confidencialidad y No Venta de Datos
            </h2>
            <p>
              <strong>JaTech no vende, alquila ni comercializa datos personales de los talleres ni de sus clientes a terceros.</strong> Toda la información cargada por cada taller permanece bajo estricto aislamiento lógico (Multi-Tenant) y es propiedad exclusiva del taller cliente.
            </p>
          </section>

          {/* SECCIÓN 4 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Server className="w-5 h-5 text-sky-400" /> 4. Almacenamiento y Seguridad (Supabase Infrastructure)
            </h2>
            <p>
              Toda la base de datos se almacena en la infraestructura de <strong>Supabase (PostgreSQL)</strong>, utilizando cifrado de datos en tránsito (TLS/SSL) y cifrado en reposo. Se aplican políticas de Row Level Security (RLS) para prevenir cualquier acceso cruzado entre cuentas de diferentes talleres.
            </p>
          </section>

          {/* SECCIÓN 5 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <UserCheck className="w-5 h-5 text-amber-400" /> 5. Derechos de Acceso, Rectificación y Supresión
            </h2>
            <p>
              Conforme a la legislación vigente (Ley 25.326 de Protección de Datos Personales), el titular de la cuenta puede solicitar en cualquier momento la exportación o eliminación definitiva de sus datos operativos contactando al equipo de soporte de JaTech.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-high border-t border-outline-variant py-6 px-6 text-center text-xs text-on-surface-variant mt-auto">
        <p>© 2026 JaTech. Software para técnicos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
