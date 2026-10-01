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
} from 'lucide-react';
import { getCurrentUserProfile, fetchCurrentShop } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { Shop, UserProfile } from '@/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copiedAlias, setCopiedAlias] = useState(false);
  const [processingDirectPayment, setProcessingDirectPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [payerEmail, setPayerEmail] = useState('');
  const [loadingShop, setLoadingShop] = useState(true);

  const statusParam = searchParams.get('status') || searchParams.get('collection_status');
  const shopIdParam = searchParams.get('shop_id');
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');

  useEffect(() => {
    async function loadData() {
      setLoadingShop(true);
      try {
        const [profile, currentShop] = await Promise.all([
          getCurrentUserProfile(),
          fetchCurrentShop(),
        ]);
        setUser(profile);

        const initialEmail = profile?.email || currentShop?.owner_email || (emailParam ? decodeURIComponent(emailParam) : '');
        if (initialEmail) {
          setPayerEmail(initialEmail);
        }

        let resolvedShop = currentShop;

        // 1. Si no hay taller activo en sesión pero viene por parámetro en URL:
        if ((!resolvedShop || resolvedShop.id === 'temp') && shopIdParam) {
          try {
            const { data: dbShop } = await supabase
              .from('shops')
              .select('*')
              .eq('id', shopIdParam)
              .maybeSingle();

            if (dbShop) {
              resolvedShop = {
                id: dbShop.id,
                name: dbShop.name || (nameParam ? decodeURIComponent(nameParam) : 'Mi Taller'),
                owner_email: dbShop.owner_email || (emailParam ? decodeURIComponent(emailParam) : ''),
                subscription_status: dbShop.subscription_status || 'active',
                plan_price: Number(dbShop.plan_price) || 20000,
                active: dbShop.active ?? true,
                trial_ends_at: dbShop.trial_ends_at,
                created_at: dbShop.created_at,
                settings: dbShop.settings || {},
              };
            }
          } catch (e) {
            console.warn('Error al consultar taller por shop_id param:', e);
          }

          if (!resolvedShop) {
            resolvedShop = {
              id: shopIdParam,
              name: nameParam ? decodeURIComponent(nameParam) : 'Mi Taller',
              owner_email: emailParam ? decodeURIComponent(emailParam) : '',
              subscription_status: 'active',
              plan_price: 20000,
              active: true,
              created_at: new Date().toISOString(),
              settings: {},
            };
          }
        }

        // 2. Si aún no se encontró, verificar datos cacheados en localStorage
        if (!resolvedShop && typeof window !== 'undefined') {
          try {
            const localShopId = localStorage.getItem('prorepair_current_shop_id');
            const localEmail = localStorage.getItem('prorepair_current_shop_email');
            const localName = localStorage.getItem('prorepair_current_shop_name');

            if (localShopId) {
              const { data: dbShop } = await supabase
                .from('shops')
                .select('*')
                .eq('id', localShopId)
                .maybeSingle();

              if (dbShop) {
                resolvedShop = {
                  id: dbShop.id,
                  name: dbShop.name || localName || 'Mi Taller',
                  owner_email: dbShop.owner_email || localEmail || '',
                  subscription_status: dbShop.subscription_status || 'active',
                  plan_price: Number(dbShop.plan_price) || 20000,
                  active: dbShop.active ?? true,
                  trial_ends_at: dbShop.trial_ends_at,
                  created_at: dbShop.created_at,
                  settings: dbShop.settings || {},
                };
              }
            }
          } catch (e) {
            console.warn('Error al recuperar taller local:', e);
          }
        }

        setShop(resolvedShop);
      } catch (err) {
        console.warn('No se pudieron obtener datos del taller:', err);
      } finally {
        setLoadingShop(false);
      }
    }
    loadData();
  }, [shopIdParam, emailParam, nameParam]);

  // Detectar si el usuario regresó de Mercado Pago con pago aprobado
  useEffect(() => {
    async function handleReturn() {
      if (statusParam === 'success' || statusParam === 'approved') {
        const targetShopId = shopIdParam || shop?.id || user?.shop_id;
        
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

        setPaymentSuccess(true);
        const timer = setTimeout(() => {
          router.push('/GestionTecnicos/dashboard');
        }, 2200);
        return () => clearTimeout(timer);
      } else if (statusParam === 'failure') {
        setErrorMessage('El pago no pudo completarse en Mercado Pago. Por favor, intenta nuevamente.');
      } else if (statusParam === 'pending') {
        setErrorMessage('El pago se encuentra pendiente de acreditación. Se activará automáticamente una vez procesado.');
      }
    }

    handleReturn();
  }, [statusParam, shopIdParam, shop?.id, user?.shop_id, router]);

  // Pago Directo de Contado con Mercado Pago ($20.000)
  const handlePayDirect = async () => {
    setProcessingDirectPayment(true);
    setErrorMessage('');

    try {
      const targetShopId = shop?.id || user?.shop_id || shopIdParam || user?.id;
      const targetEmail = (payerEmail || user?.email || shop?.owner_email || emailParam || '').trim().toLowerCase();
      const targetShopName = shop?.name || (nameParam ? decodeURIComponent(nameParam) : (user?.full_name ? `Taller de ${user?.full_name}` : 'Taller Pro'));

      if (!targetShopId) {
        router.push('/GestionTecnicos/register?redirect=/GestionTecnicos/checkout');
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
            Activar Membresía de Taller
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
                ACCESO TOTAL
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
              ARS / mes
            </span>
          </div>
        </div>

        {!loadingShop && !user && !shop?.id && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold block text-amber-200">Paso previo requerido:</span>
                <span className="text-on-surface-variant">Para asociar tu pago, registra tu taller o inicia sesión.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Link
                href="/GestionTecnicos/register?redirect=/GestionTecnicos/checkout"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3.5 py-2 rounded-xl transition-all text-center text-xs whitespace-nowrap w-full sm:w-auto shadow-md"
              >
                Registrar Taller (1 min)
              </Link>
              <Link
                href="/GestionTecnicos/login?redirect=/GestionTecnicos/checkout"
                className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface font-bold px-3.5 py-2 rounded-xl transition-all text-center text-xs whitespace-nowrap"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

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
              ¡Pago Aprobado y Taller Activado!
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mx-auto">
              Tu taller se encuentra activo con acceso total. Redirigiendo a tu panel de administración...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* OPCIÓN 1: PAGO DIRECTO CON MERCADO PAGO */}
            <div className="relative bg-gradient-to-br from-emerald-500/10 via-surface-container-high to-surface-container border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="absolute -top-3 right-4 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Acreditación Inmediata
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-title-sm text-base font-bold">
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Pagar con Mercado Pago ($20.000 ARS)
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Paga tu mes de forma segura con <strong>Dinero en cuenta de Mercado Pago</strong>, tarjeta de débito, crédito o transferencia directa. Tu cuenta se habilita de forma automática al instante.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-on-surface/90">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Acepta dinero en cuenta de Mercado Pago
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Tarjetas de Débito y Crédito
                  </div>
                </div>

                {/* Email de facturación */}
                <div className="pt-1 bg-surface-container-lowest/80 p-3 rounded-xl border border-outline-variant/60 space-y-1.5">
                  <label className="block text-[10px] font-bold text-on-surface uppercase tracking-wider">
                    Correo para la confirmación de pago:
                  </label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="email-de-pago@ejemplo.com"
                    required
                    className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayDirect}
                disabled={processingDirectPayment}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-title-sm text-sm font-extrabold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {processingDirectPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Conectando con Mercado Pago...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-black" /> Pagar $20.000 ARS con Mercado Pago
                  </>
                )}
              </button>
            </div>

            {/* OPCIÓN 2: TRANSFERENCIA ALIAS / CBU */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-title-sm text-xs font-bold">
                  <Building2 className="w-4 h-4" /> Transferencia Bancaria Alias / CBU
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  Transfiere los $20.000 ARS directamente a nuestra cuenta bancaria o billetera virtual:
                </p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container p-3 rounded-xl border border-outline-variant/40 gap-3 font-mono-data text-xs">
                  <div>
                    <div className="text-on-surface-variant text-[9px] uppercase font-bold">Alias MercadoPago / CBU:</div>
                    <div className="text-on-surface font-bold text-sm text-emerald-400">JATECH.OPS.MP</div>
                    <div className="text-on-surface-variant text-[10px]">Titular: JaTech Software SRL</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('JATECH.OPS.MP');
                      setCopiedAlias(true);
                      setTimeout(() => setCopiedAlias(false), 2000);
                    }}
                    className="px-4 py-2 bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
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
              </div>
            </div>

            {/* BOTÓN DESTACADO: CONTACTAR A JATECH POR WHATSAPP */}
            <div className="pt-2 border-t border-outline-variant/40">
              <a
                href={`https://wa.me/5492646211278?text=${encodeURIComponent(
                  `Hola JaTech, envío comprobante para la activación del taller "${shop?.name || user?.full_name || 'Mi Taller'}" (Email: ${payerEmail || user?.email || ''}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 font-title-sm text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 text-center group shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>¿Pagaste por transferencia? Enviar comprobante por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/GestionTecnicos/dashboard"
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Volver al Panel de Control
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
