import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

// Cliente de Supabase en servidor de Next.js
const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || !query.trim()) {
    return NextResponse.json({ orders: [] });
  }

  const cleanQuery = query.trim().toUpperCase();
  const codeWithHash = cleanQuery.startsWith('#') ? cleanQuery : `#${cleanQuery}`;
  const codeWithoutHash = cleanQuery.replace(/^#/, '');
  const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

  try {
    // 1. Buscar clientes que coincidan con el DNI / Documento o Teléfono ingresado
    const custConditions: string[] = [
      `document_id.eq.${cleanQuery}`,
      `document_id.eq.${codeWithoutHash}`,
      `document_id.ilike.%${cleanQuery}%`,
    ];
    if (digitsOnly.length >= 4) {
      custConditions.push(`document_id.ilike.%${digitsOnly}%`);
    }
    if (digitsOnly.length >= 6) {
      custConditions.push(`phone.ilike.%${digitsOnly}%`);
    }

    let customerIds: string[] = [];
    try {
      const { data: customerData } = await supabaseServer
        .from('customers')
        .select('id')
        .or(custConditions.join(','));

      customerIds = (customerData || []).map((c: any) => c.id);
    } catch (custErr) {
      console.warn('Error al buscar clientes para seguimiento:', custErr);
    }

    // 2. Construir filtros de búsqueda flexibles para service_orders
    const trackingFiltersArray: string[] = [
      `tracking_code.eq.${codeWithHash}`,
      `tracking_code.eq.${codeWithoutHash}`,
      `tracking_code.ilike.%${codeWithoutHash}%`,
    ];

    if (digitsOnly.length >= 3) {
      trackingFiltersArray.push(`tracking_code.ilike.%${digitsOnly}%`);
    }

    // CRÍTICO: SOLO agregar id.eq si cleanQuery es un UUID válido.
    // De lo contrario PostgreSQL falla con error 22P02 (invalid input syntax for type uuid)
    if (isUuid) {
      trackingFiltersArray.push(`id.eq.${cleanQuery}`);
    }

    if (customerIds.length > 0) {
      customerIds.forEach((cid) => {
        trackingFiltersArray.push(`customer_id.eq.${cid}`);
      });
    }

    const { data: dbOrders, error: ordersError } = await supabaseServer
      .from('service_orders')
      .select('*')
      .or(trackingFiltersArray.join(','))
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.warn('Error en consulta de órdenes en /api/track:', ordersError);
    }

    // 3. Si se encontraron órdenes directamente, enriquecer relaciones
    if (dbOrders && dbOrders.length > 0) {
      const customerIdList = Array.from(new Set(dbOrders.map((o: any) => o.customer_id).filter(Boolean)));
      const deviceIdList = Array.from(new Set(dbOrders.map((o: any) => o.device_id).filter(Boolean)));
      const shopIdList = Array.from(new Set(dbOrders.map((o: any) => o.shop_id).filter(Boolean)));

      const [custRes, devRes, shopRes] = await Promise.all([
        customerIdList.length > 0 ? supabaseServer.from('customers').select('*').in('id', customerIdList) : { data: [] },
        deviceIdList.length > 0 ? supabaseServer.from('devices').select('*').in('id', deviceIdList) : { data: [] },
        shopIdList.length > 0 ? supabaseServer.from('shops').select('*').in('id', shopIdList) : { data: [] },
      ]);

      const custMap = new Map((custRes.data || []).map((c: any) => [c.id, c]));
      const devMap = new Map((devRes.data || []).map((d: any) => [d.id, d]));
      const shopMap = new Map((shopRes.data || []).map((s: any) => [s.id, s]));

      const formattedOrders = dbOrders.map((ord: any) => {
        const cust = custMap.get(ord.customer_id);
        const dev = devMap.get(ord.device_id);
        const shp = shopMap.get(ord.shop_id);

        return {
          id: ord.id,
          shop_id: ord.shop_id,
          tracking_code: ord.tracking_code,
          device_id: ord.device_id,
          customer_id: ord.customer_id,
          status: ord.status,
          reported_fault: ord.reported_fault,
          technical_diagnosis: ord.technical_diagnosis,
          estimated_completion: ord.estimated_completion,
          final_price: ord.final_price,
          warranty_period: ord.warranty_period,
          warranty_until: ord.warranty_until,
          delivered_at: ord.delivered_at,
          created_at: ord.created_at,
          customer_name: cust?.full_name || 'Cliente',
          customer_phone: cust?.phone || '',
          customer_document_id: cust?.document_id || '',
          device_info: dev ? `${dev.type || 'Equipo'} · ${dev.brand || ''} ${dev.model || ''}`.trim() : 'Equipo',
          shop_name: shp?.name || 'Taller de Servicio Técnico',
        };
      });

      return NextResponse.json({ orders: formattedOrders });
    }

    // 4. Si no se encontraron por consulta directa (por ej. RLS activo), intentar RPC pública get_public_order_tracking
    try {
      let rpcRes = await supabaseServer.rpc('get_public_order_tracking', { p_query: cleanQuery });
      if (rpcRes.error) {
        rpcRes = await supabaseServer.rpc('get_public_order_tracking', { query: cleanQuery } as any);
      }

      if (!rpcRes.error && rpcRes.data && rpcRes.data.length > 0) {
        const rpcOrders = rpcRes.data.map((ord: any) => ({
          id: ord.id,
          tracking_code: ord.tracking_code,
          status: ord.status,
          reported_fault: ord.reported_fault,
          technical_diagnosis: ord.technical_diagnosis,
          estimated_completion: ord.estimated_completion,
          final_price: ord.final_price,
          warranty_period: ord.warranty_period,
          warranty_until: ord.warranty_until,
          delivered_at: ord.delivered_at,
          created_at: ord.created_at,
          customer_name: ord.customer_name || 'Cliente',
          customer_phone: ord.shop_phone || '',
          customer_document_id: ord.customer_document_id || '',
          device_info: `${ord.device_type || 'Equipo'} · ${ord.device_brand || ''} ${ord.device_model || ''}`.trim(),
          shop_name: ord.shop_name || 'Taller de Servicio Técnico',
        }));

        return NextResponse.json({ orders: rpcOrders });
      }
    } catch (rpcErr) {
      // Ignorar si la función no está instalada
    }

    return NextResponse.json({ orders: [] });
  } catch (err) {
    console.error('Error general en /api/track:', err);
    return NextResponse.json({ orders: [] });
  }
}
