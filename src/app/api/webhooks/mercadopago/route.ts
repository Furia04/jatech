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

    // 1. Extraer ID del pago desde query params o JSON body
    let paymentId = searchParams.get('data.id') || searchParams.get('id');
    let eventType = searchParams.get('type') || searchParams.get('topic');

    try {
      const body = await request.json();
      if (!paymentId && body?.data?.id) {
        paymentId = String(body.data.id);
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

    if (!paymentId) {
      // Notificación de otro tipo o de prueba; responder 200 OK para evitar reintentos de MP
      return NextResponse.json({ received: true, message: 'Sin ID de pago para procesar' });
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!mpAccessToken) {
      console.warn('MP_ACCESS_TOKEN no configurado en webhook. No se puede consultar API de MP.');
      return NextResponse.json({ received: true, warning: 'Token no configurado' });
    }

    // 2. Consultar detalles reales del pago en la API de Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 },
    });

    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment) {
      return NextResponse.json({ received: true, message: 'Pago no encontrado en Mercado Pago' });
    }

    const status = payment.status; // 'approved', 'pending', 'rejected', 'refunded', 'cancelled', etc.
    const shopId = payment.external_reference; // ID del taller configurado al crear la preferencia
    const payerEmail = payment.payer?.email?.toLowerCase();

    console.log(`[MercadoPago Webhook] Pago #${paymentId}: estado='${status}', shopId='${shopId}', payer='${payerEmail}'`);

    if (shopId) {
      if (status === 'approved') {
        // 3. Pago aprobado: Activar suscripción y estado del taller
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
