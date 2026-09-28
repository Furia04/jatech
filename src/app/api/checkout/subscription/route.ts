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
      back_url: `${baseUrl}/GestionTecnicos/checkout?status=success&trial_started=true&shop_id=${encodeURIComponent(shopId)}`,
      external_reference: shopId,
    };

    if (targetEmail) {
      subscriptionPayload.payer_email = targetEmail;
    }

    // 1. Primer intento oficial a la API REST de Preapproval / Suscripciones de Mercado Pago
    let mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    let mpData = await mpRes.json();

    // 2. Si falló y habíamos enviado payer_email (típico cuando el pagador es el mismo dueño de la cuenta de MP), reintentar sin payer_email
    if ((!mpRes.ok || !mpData.init_point) && subscriptionPayload.payer_email) {
      delete subscriptionPayload.payer_email;
      mpRes = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionPayload),
      });
      mpData = await mpRes.json();
    }

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
            error:
              'Tu Access Token de Mercado Pago no cuenta con permisos para crear Suscripciones recurrentes (Preapproval) o estás probando con el mismo email dueño de la cuenta. Asegúrate de usar el Access Token de Producción (comienza con APP_USR-...) en Vercel, o utiliza la opción "Pagar 1 Mes de Contado" / Transferencia.',
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
