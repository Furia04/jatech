import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, email, shopName, planPrice, moduleType = 'workshop' } = body;

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

    const isMarket = moduleType === 'market';
    const redirectPath = isMarket ? '/market/checkout' : '/GestionTecnicos/checkout';

    if (!mpAccessToken) {
      console.warn('MP_ACCESS_TOKEN no configurado. Operando en modo simulación de checkout.');
      return NextResponse.json({
        id: `sim-pref-${Date.now()}`,
        init_point: `${baseUrl}${redirectPath}?status=success&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        sandbox_init_point: `${baseUrl}${redirectPath}?status=success&shop_id=${encodeURIComponent(shopId)}&simulated=true`,
        simulated: true,
      });
    }

    // Inicializar cliente oficial de Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 },
    });

    const preference = new Preference(client);

    const defaultPrice = isMarket ? 25000 : 20000;
    const price = Number(planPrice) > 0 ? Number(planPrice) : defaultPrice;
    const defaultShopName = isMarket ? 'Comercio / Supermercado' : 'Taller de Servicio Técnico';
    const cleanShopName = shopName?.trim() || defaultShopName;

    const itemTitle = isMarket
      ? `Membresía JaTech — Plan Market Retail (${cleanShopName})`
      : `Membresía JaTech — Plan Taller Pro (${cleanShopName})`;
    const itemDesc = isMarket
      ? 'Acceso mensual completo al sistema POS de supermercado, turnos de caja Z y control de stock'
      : 'Acceso mensual completo al sistema de gestión y órdenes de servicio técnico';
    const itemId = isMarket ? 'plan-market-retail' : 'plan-taller-pro';
    const statementDesc = isMarket ? 'JATECH MARKET' : 'JATECH PRO';

    const preferenceData: any = {
      items: [
        {
          id: itemId,
          title: itemTitle,
          description: itemDesc,
          quantity: 1,
          unit_price: price,
          currency_id: 'ARS',
        },
      ],
      payer: email
        ? {
            email: email.trim().toLowerCase(),
          }
        : undefined,
      external_reference: `${shopId}__${moduleType}`,
      back_urls: {
        success: `${baseUrl}${redirectPath}?status=success&shop_id=${encodeURIComponent(shopId)}`,
        failure: `${baseUrl}${redirectPath}?status=failure&shop_id=${encodeURIComponent(shopId)}`,
        pending: `${baseUrl}${redirectPath}?status=pending&shop_id=${encodeURIComponent(shopId)}`,
      },
      statement_descriptor: statementDesc,
    };

    // Mercado Pago solo acepta auto_return y notification_url con dominios públicos HTTPS reales
    if (!isLocalhost && baseUrl.startsWith('https://')) {
      preferenceData.auto_return = 'approved';
      preferenceData.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
    }

    const result = await preference.create({ body: preferenceData });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error al generar preferencia en Mercado Pago:', error);
    const errorMsg = String(error?.message || error?.cause?.message || '');
    
    if (errorMsg.includes('UNAUTHORIZED') || errorMsg.includes('policy') || error?.status === 401) {
      return NextResponse.json(
        {
          error: 'Credenciales de Mercado Pago no autorizadas. Verifica que la variable MP_ACCESS_TOKEN en Vercel sea el "Access Token" de Producción (comienza con APP_USR-...) y pertenezca a tu cuenta de Mercado Pago Developers.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: errorMsg || 'Error al conectar con la pasarela de Mercado Pago.',
      },
      { status: 500 }
    );
  }
}
