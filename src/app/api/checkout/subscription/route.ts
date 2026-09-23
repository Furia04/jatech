import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, email, shopName, planPrice } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'El parámetro shopId es requerido.' },
        { status: 400 }
      );
    }

    const rawToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const mpAccessToken = rawToken?.trim().replace(/^['"]|['"]$/g, '');

    // Determinar la URL base pública para redirecciones y webhooks
    const urlObj = new URL(request.url);
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || urlObj.host;
    const protoHeader = request.headers.get('x-forwarded-proto') || urlObj.protocol.replace(':', '') || 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || `${protoHeader}://${hostHeader}`;
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    if (!mpAccessToken) {
      console.warn('MP_ACCESS_TOKEN no configurado. Operando en modo simulación de suscripción con 14 días de prueba.');
      return NextResponse.json({
        id: `sim-sub-${Date.now()}`,
        init_point: `${baseUrl}/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        sandbox_init_point: `${baseUrl}/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        simulated: true,
      });
    }

    const price = Number(planPrice) > 0 ? Number(planPrice) : 20000;
    const cleanShopName = shopName?.trim() || 'Taller de Servicio Técnico';
    const targetEmail = (email || '').trim().toLowerCase();

    // Payload de Suscripción Recurrente con 14 días de prueba gratuita en Mercado Pago (Preapproval)
    const subscriptionPayload: any = {
      reason: `Membresía JaTech — Plan Taller Pro (14 Días Gratis) - ${cleanShopName}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: price,
        currency_id: 'ARS',
        free_trial: {
          frequency: 14,
          frequency_type: 'days',
        },
      },
      back_url: `${baseUrl}/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}`,
      external_reference: shopId,
    };

    if (targetEmail) {
      subscriptionPayload.payer_email = targetEmail;
    }

    // Llamada oficial a la API REST de Preapproval / Suscripciones de Mercado Pago
    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok || !mpData.init_point) {
      console.error('Error al crear suscripción en Mercado Pago API:', mpData);
      const errMsg = mpData.message || mpData.error || (mpData.cause && mpData.cause[0]?.description) || 'Error al generar suscripción en Mercado Pago.';
      return NextResponse.json({ error: errMsg }, { status: mpRes.status || 400 });
    }

    return NextResponse.json({
      id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point || mpData.init_point,
    });
  } catch (error: any) {
    console.error('Error interno al crear suscripción en Mercado Pago:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al conectar con la pasarela de suscripciones.' },
      { status: 500 }
    );
  }
}
