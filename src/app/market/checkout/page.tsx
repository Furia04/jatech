'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Store,
  CreditCard,
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
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getMarketUserContext, MarketUserContext } from '@/lib/supabase/market-services';

function MarketCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copiedAlias, setCopiedAlias] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userContext, setUserContext] = useState<MarketUserContext | null>(null);
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(true);

  const statusParam = searchParams.get('status') || searchParams.get('collection_status');
  const shopIdParam = searchParams.get('shop_id');
  const isSimulated = searchParams.get('simulated') === 'true';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const ctx = await getMarketUserContext();
        setUserContext(ctx);
        if (ctx) {
          // Consultar nombre de la tienda
          const { data: shop } = await supabase
            .from('shops')
            .select('name, subscription_status')
            .eq('id', ctx.shopId)
            .maybeSingle();

          if (shop) {
            setShopName(shop.name || 'Supermercado / Comercio');
            if (shop.subscription_status === 'active') {
              setPaymentSuccess(true);
            }
          }
        }
      } catch (e) {
        console.warn('Error loading market context:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Manejo de retorno exitoso de Mercado Pago
  useEffect(() => {
    if (statusParam === 'approved' || statusParam === 'success') {
      setPaymentSuccess(true);
    }
  }, [statusParam]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText('furia.mp');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2500);
  };

  const handleCreateMercadoPagoPreference = async () => {
    setErrorMessage('');
    setProcessingPayment(true);

    try {
      const targetShopId = userContext?.shopId || shopIdParam || 'demo-market-shop';
      const targetEmail = userContext?.email || 'comercio@jatechmarket.com';

      const res = await fetch('/api/checkout/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: targetShopId,
          email: targetEmail,
          shopName: shopName || 'Mi Supermercado',
          planPrice: 25000,
          moduleType: 'market',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar pago en Mercado Pago');
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('No se recibió la URL de pago de Mercado Pago');
      }
    } catch (err: any) {
      console.error('Error al generar checkout:', err);
      setErrorMessage(err.message || 'Error al conectar con Mercado Pago');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500/30 selection:text-white">
      {/* Luces de fondo */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl shadow-emerald-500/20 mb-1 border border-emerald-400/30">
            <Store className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Membresía Mensual JaTech Market</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Plan Market Retail Pro
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Acceso ilimitado a Punto de Venta (POS), control de cajas Z, stock pesable y emisión de tickets térmicos.
          </p>
        </div>

        {/* Mensaje de Éxito si ya pagó */}
        {paymentSuccess ? (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">¡Suscripción Retail Activa!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Tu comercio cuenta con acceso completo habilitado a la plataforma de supermercado.
              </p>
            </div>
            <Link
              href="/market/pos"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900 transition-all active:scale-95"
            >
              <span>Ingresar al Punto de Venta (POS)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
            {/* Alerta de error si ocurre */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resumen del Plan */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
                  Membresía Retail
                </span>
                <span className="text-lg font-bold text-white">Plan Mensual Completo</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  1 Comercio / Cajas y Cajeros ilimitados
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">$25.000</div>
                <div className="text-[11px] text-slate-400 font-mono">ARS / mes</div>
              </div>
            </div>

            {/* Beneficios incluidos */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>POS continuo con lectura de códigos de barras y tecla F2</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Arqueo Z ciego, control de diferencias y fondos de gaveta</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Control de productos fraccionables por peso (KG / Gramos)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cobro QR integrado de Mercado Pago y tickets térmicos 58/80mm</span>
              </div>
            </div>

            {/* Botón Principal Mercado Pago */}
            <button
              type="button"
              onClick={handleCreateMercadoPagoPreference}
              disabled={processingPayment}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando con Mercado Pago...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar Suscripción con Mercado Pago</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Opción Alternativa: Transferencia Bancaria Directa */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">O transferencia bancaria directa (Alias):</span>
                <span className="text-emerald-400 font-semibold">Activación en el día</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-mono text-sm font-bold text-white">furia.mp</div>
                <button
                  type="button"
                  onClick={handleCopyAlias}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  {copiedAlias ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Alias</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href="https://wa.me/5492646211278?text=Hola%20JaTech%2C%20acabo%20de%20transferir%20para%20la%20suscripci%C3%B3n%20de%20JaTech%20Market."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enviar comprobante por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center">
          <Link
            href="/market/pos"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Volver al Punto de Venta en Modo Local</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <MarketCheckoutContent />
    </Suspense>
  );
}
