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
} from 'lucide-react';
import { getCurrentUserProfile, fetchCurrentShop } from '@/lib/supabase/services';
import { Shop, UserProfile } from '@/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copiedAlias, setCopiedAlias] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  const statusParam = searchParams.get('status') || searchParams.get('collection_status');
  const shopIdParam = searchParams.get('shop_id');

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

  // Detectar si el usuario regresó de Mercado Pago con pago aprobado
  useEffect(() => {
    if (statusParam === 'success' || statusParam === 'approved') {
      setPaymentSuccess(true);
      const timer = setTimeout(() => {
        router.push('/GestionTecnicos/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    } else if (statusParam === 'failure') {
      setErrorMessage('El pago no pudo completarse en Mercado Pago. Por favor, intenta nuevamente.');
    } else if (statusParam === 'pending') {
      setErrorMessage('El pago se encuentra pendiente de acreditación. Se activará automáticamente una vez aprobado.');
    }
  }, [statusParam, router]);

  const handlePayWithMercadoPago = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      const targetShopId = shop?.id || user?.shop_id || shopIdParam || user?.id;
      const targetEmail = user?.email || shop?.owner_email || '';
      const targetShopName = shop?.name || user?.full_name ? `Taller de ${user?.full_name}` : 'Taller Pro';

      if (!targetShopId) {
        setErrorMessage('Debes iniciar sesión o registrar tu taller antes de pagar.');
        setProcessing(false);
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
      console.error('Error al iniciar checkout con Mercado Pago:', err);
      setErrorMessage(err?.message || 'Ocurrió un problema al conectar con Mercado Pago. Intenta nuevamente.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-xl bg-surface-container border border-outline-variant/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <Logo size={42} textSubtitle="Software para técnicos" />
          </Link>
          <h1 className="font-title-sm text-xl font-bold text-on-surface pt-2">
            Activación de Membresía SaaS
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Acceso instantáneo e ilimitado para tu taller de servicio técnico.
          </p>
        </div>

        {/* Resumen del Plan */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-label-caps text-xs text-primary uppercase font-bold">
              Plan Mensual SaaS
            </span>
            <h2 className="font-title-sm text-lg font-bold text-on-surface">
              JaTech — Plan Taller Pro
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {shop?.name ? `Taller: ${shop.name} • ` : ''}Acceso completo • Facturación mensual
            </p>
          </div>

          <div className="text-right self-end sm:self-auto">
            <div className="font-display-lg text-3xl font-bold text-emerald-400 font-mono-data">
              ${Number(shop?.plan_price || 20000).toLocaleString('es-AR')}
            </div>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
              ARS / mes
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 text-error p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {paymentSuccess ? (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-title-sm text-xl font-bold text-on-surface">
              ¡Pago Aprobado y Suscripción Activada!
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Tu taller se encuentra activo con acceso total. Redirigiendo a tu panel de administración...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Opciones de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción A: Transferencia Bancaria Directa */}
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-title-sm text-sm font-bold">
                    <Building2 className="w-4 h-4" /> Transferencia Alias / CBU
                  </div>
                  <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/40 space-y-1 font-mono-data text-xs">
                    <div className="text-on-surface-variant text-[10px] uppercase font-bold">Alias MercadoPago / CBU:</div>
                    <div className="text-on-surface font-bold text-sm">JATECH.OPS.MP</div>
                    <div className="text-on-surface-variant text-[10px]">Titular: JaTech Software SRL</div>
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
                      <Check className="w-4 h-4 text-emerald-400" /> ¡Alias Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary" /> Copiar Alias de Pago
                    </>
                  )}
                </button>
              </div>

              {/* Opción B: Pasarela Oficial de Mercado Pago */}
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-title-sm text-sm font-bold">
                    <CreditCard className="w-4 h-4" /> Mercado Pago Oficial
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    Aprobación automática inmediata con Tarjeta de Débito, Crédito o Dinero en Cuenta de Mercado Pago.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayWithMercadoPago}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-title-sm text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Conectando Mercado Pago...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Pagar con Mercado Pago
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notificación de Asistencia por WhatsApp */}
            <div className="text-center pt-2 border-t border-outline-variant/40">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola, acabo de abonar la membresía de $20.000 para el taller ${shop?.name || user?.email || ''} en JaTech.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-title-sm text-on-surface-variant hover:text-emerald-400 font-semibold transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> ¿Necesitas asistencia con tu pago? Contactar por WhatsApp
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
