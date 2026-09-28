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
        init_point: `${baseUrl}/GestionTecnicos/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        sandbox_init_point: `${baseUrl}/GestionTecnicos/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        simulated: true,
      });
    }

    const price = Number(planPrice) > 0 ? Number(planPrice) : 20000;
    const cleanShopName = shopName?.trim() || 'Taller de Servicio Técnico';
    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido por Mercado Pago para registrar los 14 días de prueba.' },
        { status: 400 }
      );
    }

    // Título claro y conciso para la pantalla de suscripción de Mercado Pago (<= 60 caracteres)
    const subscriptionReason = 'JaTech Pro: 14 Días Gratis ($0 hoy)';

    // Payload de Suscripción Recurrente con 14 días de prueba gratuita en Mercado Pago (Preapproval)
    const subscriptionPayload: any = {
      payer_email: targetEmail,
      reason: subscriptionReason,
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
      back_url: `${baseUrl}/GestionTecnicos/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}`,
      external_reference: shopId,
    };

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
      const rawErrMsg = String(mpData.message || mpData.error || (mpData.cause && mpData.cause[0]?.description) || '');

      if (
        mpRes.status === 401 ||
        mpRes.status === 403 ||
        rawErrMsg.toLowerCase().includes('unauthorized') ||
        rawErrMsg.toLowerCase().includes('forbidden') ||
        rawErrMsg.toLowerCase().includes('policy')
      ) {
        return NextResponse.json(
          {
            error: `Mercado Pago no autorizó la operación con el email "${targetEmail}". Esto ocurre si ese email es el mismo de tu cuenta dueña de Mercado Pago (no permite auto-suscripción) o si la aplicación no completó la activación de negocio en el Panel de Developers de MP.`,
          },
          { status: mpRes.status || 401 }
        );
      }

      return NextResponse.json(
        { error: rawErrMsg || 'Error al generar suscripción con periodo de prueba en Mercado Pago.' },
        { status: mpRes.status || 400 }
      );
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
