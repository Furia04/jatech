'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2, Lock, Scale, Building2, HelpCircle } from 'lucide-react';

export default function TermsOfServicePage() {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-label-caps text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Marco Legal & Condiciones del Servicio
          </span>
          <h1 className="font-display-lg text-3xl md:text-5xl font-bold text-on-surface tracking-tight">
            Términos y Condiciones de Servicio
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
            Última actualización: <span className="font-bold text-on-surface">{lastUpdated}</span>
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant/80 rounded-2xl p-6 md:p-10 space-y-8 shadow-xl text-xs md:text-sm leading-relaxed text-on-surface-variant">
          {/* SECCIÓN 1 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <FileText className="w-5 h-5 text-primary" /> 1. Aceptación de los Términos
            </h2>
            <p>
              Al registrarse, acceder o utilizar la plataforma <strong>JaTech</strong> (en adelante "el Servicio"), usted (en adelante "el Usuario" o "el Taller") acepta de manera vinculante estar sujeto a los presentes Términos y Condiciones. Si no está de acuerdo con alguno de los términos, deberá abstenerse de utilizar la plataforma.
            </p>
          </section>

          {/* SECCIÓN 2 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Building2 className="w-5 h-5 text-primary" /> 2. Descripción del Servicio
            </h2>
            <p>
              <strong>JaTech</strong> es una plataforma de software como servicio (SaaS) diseñada para la administración integral de talleres de reparación técnica (telefonía, informática, electrónica multirubro, mecánica automotriz y afines). El Servicio incluye:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Recepción y seguimiento de órdenes de servicio técnico.</li>
              <li>Impresión de comandas térmicas en formato 80mm con código de orden.</li>
              <li>Portal de consulta pública B2C por DNI o código OT para clientes finales.</li>
              <li>Control de inventario, clientes y presupuesto de mano de obra y repuestos.</li>
              <li>Gestión del estado de suscripción y acceso para su equipo de técnicos.</li>
            </ul>
          </section>

          {/* SECCIÓN 3 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Lock className="w-5 h-5 text-emerald-400" /> 3. Registro de Cuenta y Seguridad
            </h2>
            <p>
              Para acceder a JaTech, el Usuario debe registrar una cuenta con datos veraces. El Usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas en su cuenta. JaTech no se responsabiliza por accesos no autorizados derivados del descuido en el manejo de contraseñas por parte del Usuario.
            </p>
          </section>

          {/* SECCIÓN 4 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" /> 4. Planes, Suscripción y Política de Suspensión
            </h2>
            <p>
              El uso comercial continuo de la plataforma JaTech requiere una membresía activa de <strong>$20.000 ARS/mes</strong> (o la tarifa vigente contratada).
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Activación:</strong> La suscripción se habilita de inmediato al confirmar el pago mediante pasarela instantánea o comprobante de transferencia bancaria.</li>
              <li><strong>Suspensión por Falta de Pago:</strong> En caso de vencimiento o impago de la membresía mensual, JaTech se reserva el derecho de restringir de forma temporal el acceso al panel operativo hasta la regulación del saldo.</li>
              <li><strong>Protección de Datos en Suspensión:</strong> Durante el período de suspensión, la información y las órdenes de su taller permanecerán resguardadas de manera segura en la base de datos sin pérdida de información.</li>
            </ul>
          </section>

          {/* SECCIÓN 5 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <Scale className="w-5 h-5 text-amber-400" /> 5. Propiedad de los Datos y Privacidad Multi-Tenant
            </h2>
            <p>
              Cada taller registrado cuenta con aislamiento lógico estricto de sus datos (Multi-Tenant). <strong>El Usuario es el propietario absoluto de la información de sus clientes, equipos, diagnósticos e inventarios.</strong> JaTech no comercializa, comparte ni utiliza los datos de los clientes de los talleres para ningún fin ajeno al funcionamiento de la plataforma.
            </p>
          </section>

          {/* SECCIÓN 6 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <CheckCircle2 className="w-5 h-5 text-sky-400" /> 6. Limitación de Responsabilidad Técnica
            </h2>
            <p>
              JaTech provee la herramienta tecnológica para el registro y gestión operativa. <strong>JaTech no interviene ni se responsabiliza por las reparaciones físicas, acuerdos de precios, garantías otorgadas por el taller a sus clientes finales, ni por eventuales pérdidas de información o daños de hardware surgidos durante la intervención técnica en los equipos.</strong>
            </p>
          </section>

          {/* SECCIÓN 7 */}
          <section className="space-y-3">
            <h2 className="font-title-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <HelpCircle className="w-5 h-5 text-primary" /> 7. Modificaciones y Contacto
            </h2>
            <p>
              JaTech se reserva el derecho de actualizar o modificar estos Términos y Condiciones para adaptarlos a mejoras tecnológicas o normativas. Para cualquier consulta sobre estos términos, puede comunicarse con el soporte oficial mediante los canales habilitados en la plataforma.
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
