'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Copy,
  Check,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  Gift,
} from 'lucide-react';
import { getCurrentUserProfile, fetchCurrentShop } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { Shop, UserProfile } from '@/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copiedAlias, setCopiedAlias] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [processingDirectPayment, setProcessingDirectPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isTrialSuccess, setIsTrialSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  const statusParam = searchParams.get('status') || searchParams.get('collection_status');
  const shopIdParam = searchParams.get('shop_id');
  const isTrialParam = searchParams.get('trial_started') === 'true';
  const isSimulated = searchParams.get('simulated') === 'true';

  useEffect(() => {
    async function loadData() {
      setLoadingShop(true);
      try {
        const [profile, currentShop] = await Promise.all([
          getCurrentUserProfile(),
          fetchCurrentShop(),
        ]);
        setUser(profile);
        setShop(currentShop);
      } catch (err) {
        console.warn('No se pudieron obtener datos del taller:', err);
      } finally {
        setLoadingShop(false);
      }
    }
    loadData();
  }, []);

  // Detectar si el usuario regresó de Mercado Pago con prueba o pago aprobado
  useEffect(() => {
    async function handleReturn() {
      if (statusParam === 'success' || statusParam === 'approved') {
        const targetShopId = shopIdParam || shop?.id || user?.shop_id;
        
        if (isTrialParam) {
          setIsTrialSuccess(true);
          // Si es simulación local o retorno directo, asegurar actualización en Supabase
          if (targetShopId) {
            const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            await supabase
              .from('shops')
              .update({
                subscription_status: 'trialing',
                active: true,
                trial_ends_at: trialEnd,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetShopId);
          }
        } else {
          // Pago directo regular
          if (targetShopId) {
            await supabase
              .from('shops')
              .update({
                subscription_status: 'active',
                active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetShopId);
          }
        }

        setPaymentSuccess(true);
        const timer = setTimeout(() => {
          router.push('/GestionTecnicos/dashboard');
        }, 2200);
        return () => clearTimeout(timer);
      } else if (statusParam === 'failure') {
        setErrorMessage('La operación no pudo completarse en Mercado Pago. Por favor, intenta nuevamente.');
      } else if (statusParam === 'pending') {
        setErrorMessage('La operación se encuentra pendiente de acreditación. Se activará automáticamente una vez procesada.');
      }
    }

    handleReturn();
  }, [statusParam, isTrialParam, shopIdParam, shop?.id, user?.shop_id, router]);

  // Opción 1: Iniciar Suscripción con 14 días de prueba gratis ($0 hoy)
  const handleStartFreeTrial = async () => {
    setProcessingSubscription(true);
    setErrorMessage('');

    try {
      const targetShopId = shop?.id || user?.shop_id || shopIdParam || user?.id;
      const targetEmail = user?.email || shop?.owner_email || '';
      const targetShopName = shop?.name || (user?.full_name ? `Taller de ${user?.full_name}` : 'Taller Pro');

      if (!targetShopId) {
        setErrorMessage('Debes iniciar sesión o registrar tu taller antes de comenzar la prueba.');
        setProcessingSubscription(false);
        return;
      }

      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: targetShopId,
          email: targetEmail,
          shopName: targetShopName,
          planPrice: shop?.plan_price || 20000,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al iniciar suscripción con periodo de prueba.');
      }

      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error('No se recibió la URL de Mercado Pago.');
      }
    } catch (err: any) {
      console.error('Error al iniciar prueba gratis con Mercado Pago:', err);
      setErrorMessage(err?.message || 'Ocurrió un problema al conectar con Mercado Pago. Intenta nuevamente.');
      setProcessingSubscription(false);
    }
  };

  // Opción 2: Pagar mes de contado con Mercado Pago
  const handlePayDirect = async () => {
    setProcessingDirectPayment(true);
    setErrorMessage('');

    try {
      const targetShopId = shop?.id || user?.shop_id || shopIdParam || user?.id;
      const targetEmail = user?.email || shop?.owner_email || '';
      const targetShopName = shop?.name || (user?.full_name ? `Taller de ${user?.full_name}` : 'Taller Pro');

      if (!targetShopId) {
        setErrorMessage('Debes iniciar sesión o registrar tu taller antes de pagar.');
        setProcessingDirectPayment(false);
        return;
      }

      const res = await fetch('/api/checkout/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: targetShopId,
          email: targetEmail,
          shopName: targetShopName,
          planPrice: shop?.plan_price || 20000,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al conectar con Mercado Pago.');
      }

      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error('No se recibió la URL de pago de Mercado Pago.');
      }
    } catch (err: any) {
      console.error('Error al iniciar pago directo con Mercado Pago:', err);
      setErrorMessage(err?.message || 'Ocurrió un problema al conectar con Mercado Pago. Intenta nuevamente.');
      setProcessingDirectPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-surface-container border border-outline-variant/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Logo size={42} textSubtitle="Software para talleres y técnicos" />
          </Link>
          <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-on-surface pt-2">
            Elige cómo activar tu Taller en JaTech
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
            Disfruta de control total de órdenes de servicio, comanda térmica de 80mm, inventario y seguimiento para clientes.
          </p>
        </div>

        {/* Resumen del Plan */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-xs text-primary uppercase font-bold">
                Membresía Mensual SaaS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                14 DÍAS GRATIS
              </span>
            </div>
            <h2 className="font-title-sm text-lg font-bold text-on-surface mt-1">
              JaTech — Plan Taller Pro
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {shop?.name ? `Taller: ${shop.name} • ` : ''}Acceso ilimitado a todas las herramientas
            </p>
          </div>

          <div className="text-right self-end sm:self-auto">
            <div className="font-display-lg text-3xl font-bold text-emerald-400 font-mono-data">
              $20.000
            </div>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              ARS / mes ($0 hoy)
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {paymentSuccess ? (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-title-sm text-xl font-bold text-on-surface">
              {isTrialSuccess
                ? '¡Periodo de Prueba de 14 Días Iniciado!'
                : '¡Pago Aprobado y Suscripción Activada!'}
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
              {isTrialSuccess
                ? 'Tu taller ya tiene acceso total gratuito por 14 días. Tu primer débito automático será recién al finalizar este periodo.'
                : 'Tu taller se encuentra activo con acceso total. Redirigiendo a tu panel de administración...'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* OPCIÓN 1 (DESTACADA): 14 DÍAS DE PRUEBA GRATIS CON TARJETA */}
            <div className="relative bg-gradient-to-br from-primary/10 via-surface-container-high to-surface-container border-2 border-primary/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="absolute -top-3 right-4 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recomendado • Sin Cargo Hoy
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-title-sm text-base font-bold">
                  <Gift className="w-5 h-5 text-primary" /> 14 Días de Prueba Gratis con Tarjeta
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Registra tu tarjeta de débito o crédito para validar tu cuenta. <strong className="text-on-surface font-semibold">$0 cobrados hoy</strong>. Tu primer cobro de <strong>$20.000 ARS</strong> será el día 14. Puedes cancelar en cualquier momento con 1 click.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-on-surface/90">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Acceso instantáneo e ilimitado
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Cancelación libre sin penalidad
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartFreeTrial}
                disabled={processingSubscription || processingDirectPayment}
                className="w-full bg-primary hover:bg-primary/90 text-on-primary font-title-sm text-sm font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingSubscription ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Conectando Mercado Pago...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Comenzar 14 Días de Prueba Gratis ($0 Hoy)
                  </>
                )}
              </button>
            </div>

            {/* OPCIÓN 2 Y 3: TRANSFERENCIA CBU O PAGO DIRECTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción B: Transferencia Bancaria Directa */}
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-title-sm text-xs font-bold">
                    <Building2 className="w-4 h-4" /> Transferencia Alias / CBU
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Paga el mes de $20.000 por transferencia y te activamos manualmente.
                  </p>
                  <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/40 space-y-0.5 font-mono-data text-xs">
                    <div className="text-on-surface-variant text-[9px] uppercase font-bold">Alias MercadoPago / CBU:</div>
                    <div className="text-on-surface font-bold text-xs">JATECH.OPS.MP</div>
                    <div className="text-on-surface-variant text-[9px]">Titular: JaTech Software SRL</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('JATECH.OPS.MP');
                    setCopiedAlias(true);
                    setTimeout(() => setCopiedAlias(false), 2000);
                  }}
                  className="w-full bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedAlias ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> ¡Alias Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" /> Copiar Alias
                    </>
                  )}
                </button>
              </div>

              {/* Opción C: Pago Directo 1 Mes Mercado Pago */}
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-title-sm text-xs font-bold">
                    <CreditCard className="w-4 h-4" /> Pagar 1 Mes de Contado
                  </div>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Abona directamente $20.000 ARS por 1 mes con dinero en cuenta, débito o crédito.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayDirect}
                  disabled={processingDirectPayment || processingSubscription}
                  className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-title-sm text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {processingDirectPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Conectando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Pagar $20.000 Ahora
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Asistencia por WhatsApp */}
            <div className="text-center pt-2 border-t border-outline-variant/40">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola, necesito asistencia con la activación de la membresía para el taller ${shop?.name || user?.email || ''} en JaTech.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-title-sm text-on-surface-variant hover:text-emerald-400 font-semibold transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> ¿Preguntas o asistencia con tu pago? Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
