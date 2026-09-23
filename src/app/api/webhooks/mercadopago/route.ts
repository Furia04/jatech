import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

// Cliente administrativo con permisos de Service Role para actualizar tiendas sin bloqueo de RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Extraer ID y tipo de evento desde query params o JSON body
    let resourceId = searchParams.get('data.id') || searchParams.get('id');
    let eventType = searchParams.get('type') || searchParams.get('topic');

    try {
      const body = await request.json();
      if (!resourceId && body?.data?.id) {
        resourceId = String(body.data.id);
      }
      if (!eventType && body?.type) {
        eventType = body.type;
      }
      if (!eventType && body?.action) {
        eventType = body.action;
      }
    } catch (e) {
      // El body puede venir vacío o no ser JSON en ciertas peticiones IPN
    }

    if (!resourceId) {
      // Notificación de otro tipo o de prueba; responder 200 OK para evitar reintentos de MP
      return NextResponse.json({ received: true, message: 'Sin ID para procesar' });
    }

    const rawToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const mpAccessToken = rawToken?.trim().replace(/^['"]|['"]$/g, '');

    if (!mpAccessToken) {
      console.warn('MP_ACCESS_TOKEN no configurado en webhook. No se puede consultar API de MP.');
      return NextResponse.json({ received: true, warning: 'Token no configurado' });
    }

    const isSubscriptionEvent =
      eventType === 'subscription_preapproval' ||
      eventType === 'preapproval' ||
      eventType === 'subscription_authorized_payment';

    // 2. MANEJO DE SUSCRIPCIONES / PREAPPROVAL (TRIAL DE 14 DÍAS Y ESTADO DE RECURRENCIA)
    if (isSubscriptionEvent) {
      try {
        const preapprovalRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
          },
        });

        if (preapprovalRes.ok) {
          const preapprovalData = await preapprovalRes.json();
          const shopId = preapprovalData.external_reference;
          const preapprovalStatus = preapprovalData.status; // 'authorized', 'paused', 'cancelled', 'pending'

          console.log(`[MercadoPago Webhook] Preapproval #${resourceId}: estado='${preapprovalStatus}', shopId='${shopId}'`);

          if (shopId) {
            if (preapprovalStatus === 'authorized') {
              // Calcular fecha de finalización del periodo de prueba (14 días desde ahora)
              const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

              const { error: subErr } = await supabaseAdmin
                .from('shops')
                .update({
                  subscription_status: 'trialing',
                  active: true,
                  mp_preapproval_id: String(resourceId),
                  trial_ends_at: trialEndsAt,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', shopId);

              if (subErr) {
                console.error(`[MercadoPago Webhook] Error al activar periodo de prueba para taller ${shopId}:`, subErr);
              } else {
                console.log(`[MercadoPago Webhook] ¡Periodo de prueba de 14 días activado para taller ${shopId}!`);
              }
            } else if (preapprovalStatus === 'cancelled') {
              await supabaseAdmin
                .from('shops')
                .update({
                  subscription_status: 'canceled',
                  active: false,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', shopId);
            }
          }

          return NextResponse.json({ received: true, type: 'preapproval', status: preapprovalStatus, shopId });
        }
      } catch (preErr) {
        console.error('[MercadoPago Webhook] Error al consultar preapproval:', preErr);
      }
    }

    // 3. MANEJO DE PAGOS INDIVIDUALES / COBROS AUTOMÁTICOS DE SUSCRIPCIÓN
    const client = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 },
    });

    const paymentClient = new Payment(client);
    let payment: any = null;

    try {
      payment = await paymentClient.get({ id: resourceId });
    } catch (payGetErr) {
      // Podría ser un ID de suscripción que no vino etiquetado como tal
      console.warn(`[MercadoPago Webhook] No se encontró pago con ID ${resourceId}, verificando si es preapproval...`);
    }

    if (!payment) {
      return NextResponse.json({ received: true, message: 'Recurso procesado o no encontrado como pago' });
    }

    const status = payment.status; // 'approved', 'pending', 'rejected', 'refunded', 'cancelled', etc.
    const shopId = payment.external_reference; // ID del taller configurado al crear la preferencia / preapproval
    const payerEmail = payment.payer?.email?.toLowerCase();

    console.log(`[MercadoPago Webhook] Pago #${resourceId}: estado='${status}', shopId='${shopId}', payer='${payerEmail}'`);

    if (shopId) {
      if (status === 'approved') {
        // Pago aprobado: Activar suscripción y estado del taller a 'active'
        const { error: updateErr } = await supabaseAdmin
          .from('shops')
          .update({
            subscription_status: 'active',
            active: true,
            mp_payment_id: String(payment.id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', shopId);

        if (updateErr) {
          console.error(`[MercadoPago Webhook] Error al activar taller ${shopId} en Supabase:`, updateErr);
        } else {
          console.log(`[MercadoPago Webhook] ¡Taller ${shopId} activado exitosamente!`);
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        // Pago rechazado o cancelado
        await supabaseAdmin
          .from('shops')
          .update({
            subscription_status: 'pending_payment',
            updated_at: new Date().toISOString(),
          })
          .eq('id', shopId);
      } else if (status === 'refunded' || status === 'charged_back') {
        // Pago reembolsado o contracargo
        await supabaseAdmin
          .from('shops')
          .update({
            subscription_status: 'canceled',
            active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shopId);
      }
    }

    return NextResponse.json({ received: true, status, shopId });
  } catch (err: any) {
    console.error('[MercadoPago Webhook] Error interno:', err);
    // Responder siempre 200 para que Mercado Pago no reintente indefinidamente
    return NextResponse.json({ received: true, error: err?.message || 'Error procesando webhook' }, { status: 200 });
  }
}

export async function GET(request: Request) {
  // Manejo de peticiones GET de prueba o verificación de endpoint
  return NextResponse.json({
    status: 'online',
    service: 'JaTech Mercado Pago Webhook Gateway',
    timestamp: new Date().toISOString(),
  });
}
