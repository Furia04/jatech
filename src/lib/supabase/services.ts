import { supabase } from './client';
import { Customer, Device, DeviceCategoryTemplate, InventoryItem, OrderSpare, ServiceOrder, Shop, UserProfile } from '@/types';

// =======================================================
// OBTENER PERFIL Y TALLER (TENANT) DEL USUARIO AUTENTICADO
// =======================================================

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as any) || 'owner',
        shop_id: user.user_metadata?.shop_id || user.id,
        full_name: user.user_metadata?.full_name || user.email,
        can_view_financials: true,
      };
    }

    return data;
  } catch (err) {
    return null;
  }
}

export async function fetchCurrentShop(): Promise<Shop | null> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return null;

    const targetShopId = profile.shop_id || profile.id;
    const { data: dbShop } = await supabase
      .from('shops')
      .select('*')
      .or(`id.eq.${targetShopId},owner_email.eq.${profile.email}`)
      .maybeSingle();

    if (!dbShop) return null;

    return {
      id: dbShop.id,
      name: dbShop.name || 'Mi Taller',
      owner_email: dbShop.owner_email || profile.email,
      subscription_status: dbShop.subscription_status || 'active',
      mp_preapproval_id: dbShop.mp_preapproval_id,
      created_at: dbShop.created_at,
      settings: dbShop.settings || {},
    };
  } catch (err) {
    return null;
  }
}

// =======================================================
// PANEL DE SUPER ADMINISTRADOR (100% REAL DE SUPABASE)
// =======================================================

export async function fetchAllShopsForAdmin(): Promise<Shop[]> {
  try {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/shops');
        if (res.ok) {
          const data = await res.json();
          if (data?.shops && Array.isArray(data.shops)) {
            return data.shops;
          }
        }
      } catch (apiErr) {
        console.warn('Fallback a consulta directa Supabase desde cliente:', apiErr);
      }
    }

    const { data: dbShops, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopsError) {
      console.error('Error al consultar tabla shops en Supabase:', shopsError);
    }

    const { data: dbUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.warn('Error al consultar tabla users en Supabase:', usersError);
    }

    const { data: ordersData } = await supabase
      .from('service_orders')
      .select('shop_id');

    const ordersCountMap: Record<string, number> = {};
    if (ordersData) {
      ordersData.forEach((ord: any) => {
        if (ord.shop_id) {
          ordersCountMap[ord.shop_id] = (ordersCountMap[ord.shop_id] || 0) + 1;
        }
      });
    }

    const shopMap = new Map<string, Shop>();

    if (dbShops && dbShops.length > 0) {
      dbShops.forEach((s: any) => {
        shopMap.set(s.id, {
          id: s.id,
          name: s.name || 'Taller sin nombre',
          owner_email: s.owner_email || 'Sin correo',
          subscription_status: s.subscription_status || 'pending_payment',
          plan_price: Number(s.plan_price) || 20000,
          active: s.active ?? false,
          created_at: s.created_at || new Date().toISOString(),
          orders_count: ordersCountMap[s.id] || 0,
        });
      });
    }

    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((u: any) => {
        const userEmail = (u.email || '').toLowerCase();
        const targetShopId = u.shop_id || u.id;

        const alreadyExists = shopMap.has(targetShopId) || Array.from(shopMap.values()).some(s => s.owner_email.toLowerCase() === userEmail);

        if (!alreadyExists && userEmail) {
          shopMap.set(targetShopId, {
            id: targetShopId,
            name: u.full_name ? `Taller de ${u.full_name}` : `Taller (${u.email})`,
            owner_email: u.email,
            subscription_status: 'pending_payment',
            plan_price: 20000,
            active: false,
            created_at: u.created_at || new Date().toISOString(),
            orders_count: ordersCountMap[targetShopId] || 0,
          });
        }
      });
    }

    return Array.from(shopMap.values());
  } catch (err) {
    console.error('Error crítico en fetchAllShopsForAdmin:', err);
    return [];
  }
}

export async function updateShopSubscriptionStatus(
  shopId: string,
  status: 'active' | 'pending_payment' | 'past_due' | 'canceled',
  active: boolean
) {
  try {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/shops/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId, status, active }),
        });
        if (res.ok) {
          return true;
        }
      } catch (apiErr) {
        console.warn('Fallback a actualización directa Supabase desde cliente:', apiErr);
      }
    }

    const { error } = await supabase
      .from('shops')
      .update({
        subscription_status: status,
        active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${shopId},shop_id.eq.${shopId}`)
        .maybeSingle();

      if (userProfile) {
        await supabase.from('shops').upsert([{
          id: shopId,
          name: userProfile.full_name ? `Taller de ${userProfile.full_name}` : `Taller (${userProfile.email})`,
          owner_email: userProfile.email,
          subscription_status: status,
          plan_price: 20000,
          active: active,
        }]);
      }
    }

    return true;
  } catch (err) {
    console.error('Error al actualizar estado en Supabase:', err);
    return false;
  }
}

// =======================================================
// DESCUENTO AUTOMÁTICO DE STOCK DE INVENTARIO
// =======================================================

export async function deductInventoryStock(inventoryItemId: string, quantity: number = 1) {
  try {
    const { data: item } = await supabase
      .from('inventory')
      .select('stock')
      .eq('id', inventoryItemId)
      .maybeSingle();

    if (item) {
      const newStock = Math.max(0, (item.stock || 0) - quantity);
      await supabase
        .from('inventory')
        .update({ stock: newStock })
        .eq('id', inventoryItemId);
    }
  } catch (err) {
    console.warn('Error al descontar stock de inventario:', err);
  }
}

// =======================================================
// ENRIQUECER ÓRDENES CON CLIENTES Y DISPOSITIVOS (ANTI-ERROR 400)
// =======================================================

async function populateOrdersRelations(rawOrders: any[]): Promise<any[]> {
  if (!rawOrders || rawOrders.length === 0) return [];

  const customerIds = Array.from(new Set(rawOrders.map((o: any) => o.customer_id).filter(Boolean)));
  const deviceIds = Array.from(new Set(rawOrders.map((o: any) => o.device_id).filter(Boolean)));

  const customerMap = new Map<string, any>();
  if (customerIds.length > 0) {
    try {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, phone, document_id')
        .in('id', customerIds);
      (customers || []).forEach((c: any) => customerMap.set(c.id, c));
    } catch (e) {
      console.warn('Error al cargar clientes en lote:', e);
    }
  }

  const deviceMap = new Map<string, any>();
  if (deviceIds.length > 0) {
    try {
      const { data: devices } = await supabase
        .from('devices')
        .select('id, type, brand, model, serial_number, custom_attributes')
        .in('id', deviceIds);
      (devices || []).forEach((d: any) => deviceMap.set(d.id, d));
    } catch (e) {
      console.warn('Error al cargar dispositivos en lote:', e);
    }
  }

  return rawOrders.map((ord: any) => ({
    ...ord,
    customers: ord.customers || customerMap.get(ord.customer_id) || null,
    devices: ord.devices || deviceMap.get(ord.device_id) || null,
  }));
}

// =======================================================
// ÓRDENES DE SERVICIO (MULTI-TENANT REAL + LOCAL FALLBACK)
// =======================================================

export async function fetchServiceOrders(): Promise<ServiceOrder[]> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return [];

    let sourceOrders: any[] = [];

    // 1. Intentar consulta con JOIN directo aislada por taller
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        *,
        customers ( full_name, phone, document_id ),
        devices ( type, brand, model, serial_number )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      sourceOrders = data;
    } else {
      if (error) {
        console.warn('Supabase join directo falló (posible falta de FK o relación en PostgREST). Activando carga desacoplada anti-error 400:', error.message || error);
      }
      // 2. Fallback desacoplado: consultar tabla service_orders directamente aislada por taller
      const { data: rawOrders, error: rawError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (!rawError && rawOrders) {
        sourceOrders = await populateOrdersRelations(rawOrders);
      }
    }

    let localOrders: ServiceOrder[] = [];
    if (typeof window !== 'undefined') {
      try {
        const storedStr = localStorage.getItem('prorepair_local_orders');
        if (storedStr) {
          localOrders = JSON.parse(storedStr);
        }
      } catch (e) {}
    }

    const dbOrders = sourceOrders.map((ord: any) => ({
      id: ord.id,
      shop_id: ord.shop_id,
      tracking_code: ord.tracking_code,
      device_id: ord.device_id,
      customer_id: ord.customer_id,
      technician_id: ord.technician_id,
      status: ord.status,
      reported_fault: ord.reported_fault,
      technical_diagnosis: ord.technical_diagnosis,
      internal_notes: ord.internal_notes,
      estimated_completion: ord.estimated_completion,
      estimated_cost: ord.estimated_cost,
      final_price: ord.final_price,
      advance_payment: Number(ord.advance_payment) || 0,
      payment_method: ord.payment_method || 'efectivo',
      device_photos: Array.isArray(ord.device_photos) ? ord.device_photos : [],
      warranty_period: ord.warranty_period,
      warranty_until: ord.warranty_until,
      delivered_at: ord.delivered_at,
      created_at: ord.created_at,
      customer_name: ord.customers?.full_name || 'Cliente sin nombre',
      customer_phone: ord.customers?.phone || '',
      customer_document_id: ord.customers?.document_id || '',
      device_info: `${ord.devices?.type || 'Equipo'} · ${ord.devices?.brand || ''} ${ord.devices?.model || ''}`.trim(),
      custom_attributes: ord.devices?.custom_attributes || {},
    }));

    const orderMap = new Map<string, ServiceOrder>();
    dbOrders.forEach((o) => orderMap.set(o.tracking_code, o));
    localOrders.forEach((o) => {
      if (!orderMap.has(o.tracking_code)) {
        orderMap.set(o.tracking_code, o);
      }
    });

    return Array.from(orderMap.values());
  } catch (err) {
    console.error('Error general en fetchServiceOrders:', err);
    return [];
  }
}

export async function createServiceOrderWithDevice(orderPayload: {
  customer: { full_name: string; phone: string; document_id?: string; email?: string };
  device: { type: string; brand: string; model: string; serial_number?: string; custom_attributes?: any };
  order: {
    reported_fault: string;
    estimated_cost?: number;
    final_price?: number;
    advance_payment?: number;
    payment_method?: string;
    device_photos?: string[];
    tracking_code?: string;
  };
}) {
  const profile = await getCurrentUserProfile();
  let shopId = profile?.shop_id || profile?.id;

  // 1. Validar que el usuario pertenezca a un taller autenticado
  if (!shopId) {
    throw new Error('Debe iniciar sesión para registrar una orden de servicio.');
  }

  // 2. Insertar o recuperar Cliente dentro del mismo taller
  let customerId = '';
  if (orderPayload.customer.document_id) {
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('shop_id', shopId)
      .eq('document_id', orderPayload.customer.document_id)
      .maybeSingle();

    if (existingCust) {
      customerId = existingCust.id;
    }
  }

  if (!customerId) {
    const { data: newCust, error: custErr } = await supabase
      .from('customers')
      .insert([{
        shop_id: shopId,
        full_name: orderPayload.customer.full_name,
        phone: orderPayload.customer.phone,
        document_id: orderPayload.customer.document_id || null,
        email: orderPayload.customer.email || null,
      }])
      .select()
      .single();

    if (custErr) {
      console.error('Error al insertar cliente en Supabase:', custErr);
      throw custErr;
    }
    customerId = newCust.id;
  }

  // 3. Insertar Dispositivo
  const { data: newDevice, error: devErr } = await supabase
    .from('devices')
    .insert([{
      shop_id: shopId,
      customer_id: customerId,
      type: orderPayload.device.type,
      brand: orderPayload.device.brand,
      model: orderPayload.device.model,
      serial_number: orderPayload.device.serial_number || null,
      custom_attributes: orderPayload.device.custom_attributes || {},
    }])
    .select()
    .single();

  if (devErr) {
    console.error('Error al insertar equipo en Supabase:', devErr);
    throw devErr;
  }

  // 4. Insertar Orden de Servicio con el Código de Seguimiento Exacto
  let finalTrackingCode = orderPayload.order.tracking_code?.trim() || `#WO-${Math.floor(1000 + Math.random() * 9000)}`;
  if (!finalTrackingCode.startsWith('#')) {
    finalTrackingCode = `#${finalTrackingCode}`;
  }

  const { data: newOrder, error: ordErr } = await supabase
    .from('service_orders')
    .insert([{
      shop_id: shopId,
      tracking_code: finalTrackingCode,
      device_id: newDevice.id,
      customer_id: customerId,
      status: 'recibido',
      reported_fault: orderPayload.order.reported_fault,
      estimated_cost: orderPayload.order.estimated_cost || 0,
      final_price: orderPayload.order.final_price || 0,
      advance_payment: orderPayload.order.advance_payment || 0,
      payment_method: orderPayload.order.payment_method || 'efectivo',
      device_photos: orderPayload.order.device_photos || [],
    }])
    .select()
    .single();

  if (ordErr) {
    console.error('Error al insertar orden de servicio en Supabase:', ordErr);
    throw ordErr;
  }

  return newOrder;
}

export async function updateServiceOrderStatus(
  orderId: string,
  status: string,
  technicalDiagnosis?: string,
  finalPrice?: number,
  warrantyPeriod?: string,
  warrantyUntil?: string,
  deliveredAt?: string,
  trackingCode?: string,
  advancePayment?: number,
  paymentMethod?: string,
  devicePhotos?: string[]
) {
  // 1. SIEMPRE sincronizar en localStorage de forma instantánea
  if (typeof window !== 'undefined') {
    try {
      const storedStr = localStorage.getItem('prorepair_local_orders');
      if (storedStr) {
        const localOrders = JSON.parse(storedStr);
        const updated = localOrders.map((o: any) => {
          if (o.id === orderId || (trackingCode && o.tracking_code === trackingCode) || o.tracking_code === orderId) {
            return {
              ...o,
              status,
              technical_diagnosis: technicalDiagnosis !== undefined ? technicalDiagnosis : o.technical_diagnosis,
              final_price: finalPrice !== undefined ? finalPrice : o.final_price,
              advance_payment: advancePayment !== undefined ? advancePayment : o.advance_payment,
              payment_method: paymentMethod !== undefined ? paymentMethod : o.payment_method,
              device_photos: devicePhotos !== undefined ? devicePhotos : o.device_photos,
              warranty_period: warrantyPeriod !== undefined ? warrantyPeriod : o.warranty_period,
              warranty_until: warrantyUntil !== undefined ? warrantyUntil : o.warranty_until,
              delivered_at: deliveredAt !== undefined ? deliveredAt : o.delivered_at,
              updated_at: new Date().toISOString(),
            };
          }
          return o;
        });
        localStorage.setItem('prorepair_local_orders', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error al actualizar orden en localStorage:', e);
    }
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

  // 2. Preparar payload de actualización para Supabase
  const updateData: any = {
    status,
    technical_diagnosis: technicalDiagnosis,
    final_price: finalPrice,
    updated_at: new Date().toISOString(),
  };

  if (advancePayment !== undefined) updateData.advance_payment = advancePayment;
  if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
  if (devicePhotos !== undefined) updateData.device_photos = devicePhotos;
  if (warrantyPeriod !== undefined) updateData.warranty_period = warrantyPeriod;
  if (warrantyUntil !== undefined) updateData.warranty_until = warrantyUntil;
  if (deliveredAt !== undefined) updateData.delivered_at = deliveredAt;

  try {
    let query = supabase.from('service_orders').update(updateData);
    if (isUuid) {
      query = query.eq('id', orderId);
    } else if (trackingCode) {
      query = query.eq('tracking_code', trackingCode);
    } else {
      query = query.eq('tracking_code', orderId);
    }

    let { data, error } = await query.select();

    // Reintento sin columnas de garantía si la BD no fue migrada con esas columnas
    if (error && (error.message?.toLowerCase().includes('column') || error.code === '42703')) {
      console.warn('Columnas de garantía no presentes en la tabla service_orders, reintentando actualización básica:', error.message);
      const basicUpdate = {
        status,
        technical_diagnosis: technicalDiagnosis,
        final_price: finalPrice,
        updated_at: new Date().toISOString(),
      };
      let retryQuery = supabase.from('service_orders').update(basicUpdate);
      if (isUuid) {
        retryQuery = retryQuery.eq('id', orderId);
      } else if (trackingCode) {
        retryQuery = retryQuery.eq('tracking_code', trackingCode);
      } else {
        retryQuery = retryQuery.eq('tracking_code', orderId);
      }
      const retryRes = await retryQuery.select();
      data = retryRes.data;
      error = retryRes.error;
    }

    // Si data vino vacío (0 filas afectadas) y teníamos trackingCode, intentar por tracking_code
    if (!error && (!data || data.length === 0) && trackingCode && isUuid) {
      const byCodeRes = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('tracking_code', trackingCode)
        .select();
      if (byCodeRes.data && byCodeRes.data.length > 0) {
        data = byCodeRes.data;
      }
    }

    if (error) {
      console.error('Error al actualizar en Supabase:', error);
      if (isUuid) {
        throw error;
      }
    }

    // Si el estado pasa a 'entregado', convertir repuestos reservados a 'consumed' (cierre de venta)
    if (status === 'entregado') {
      try {
        await supabase
          .from('order_spares')
          .update({ status: 'consumed', updated_at: new Date().toISOString() })
          .eq('order_id', orderId)
          .eq('status', 'reserved');
      } catch (e) {
        console.warn('Error al actualizar estado de repuestos a consumed:', e);
      }
    }

    return data;
  } catch (err) {
    if (!isUuid) {
      return true; // Ya guardado localmente
    }
    throw err;
  }
}

// =======================================================
// CLIENTES (MULTI-TENANT REAL)
// =======================================================

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

// =======================================================
// INVENTARIO (MULTI-TENANT REAL)
// =======================================================

export async function fetchInventory(): Promise<InventoryItem[]> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return [];

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .order('name', { ascending: true });

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

// =======================================================
// SEGUIMIENTO B2C PÚBLICO POR DNI O CÓDIGO DE ORDEN
// =======================================================

export async function fetchPublicOrdersByDocumentIdOrCode(query: string): Promise<ServiceOrder[]> {
  const cleanQuery = query.trim().toUpperCase();
  if (!cleanQuery) return [];

  try {
    // 1. Intentar consulta mediante la API Route interna (/api/track)
    const res = await fetch(`/api/track?query=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.orders && data.orders.length > 0) {
        return data.orders;
      }
    }
  } catch (e) {
    console.warn('API /api/track no disponible, usando fallback directo:', e);
  }

  // 2. Fallback directo en cliente (por si la API Route del servidor no tiene service role key y el cliente sí tiene sesión o RPC)
  if (typeof window !== 'undefined') {
    try {
      const codeWithHash = cleanQuery.startsWith('#') ? cleanQuery : `#${cleanQuery}`;
      const codeWithoutHash = cleanQuery.replace(/^#/, '');
      const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

      // 2.1 Intentar RPC pública si existe
      try {
        let rpcRes = await supabase.rpc('get_public_order_tracking', { p_query: cleanQuery });
        if (rpcRes.error) {
          rpcRes = await supabase.rpc('get_public_order_tracking', { query: cleanQuery } as any);
        }
        if (!rpcRes.error && rpcRes.data && rpcRes.data.length > 0) {
          return rpcRes.data.map((ord: any) => ({
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
            customer_phone: ord.customer_phone || '',
            customer_document_id: ord.customer_document_id || '',
            device_info: `${ord.device_type || 'Equipo'} · ${ord.device_brand || ''} ${ord.device_model || ''}`.trim(),
            shop_name: ord.shop_name || 'Taller de Servicio Técnico',
          }));
        }
      } catch (rpcErr) {}

      // 2.2 Intentar consulta directa con el cliente
      const clientFilters = [
        `tracking_code.eq.${codeWithHash}`,
        `tracking_code.eq.${codeWithoutHash}`,
        `tracking_code.ilike.%${codeWithoutHash}%`,
        digitsOnly.length >= 3 ? `tracking_code.ilike.%${digitsOnly}%` : null,
        isUuid ? `id.eq.${cleanQuery}` : null,
      ].filter(Boolean);

      const { data: cData } = await supabase
        .from('customers')
        .select('id')
        .or(`document_id.eq.${cleanQuery},document_id.eq.${codeWithoutHash}`);

      const cIds = (cData || []).map((c: any) => c.id);
      if (cIds.length > 0) {
        cIds.forEach((cid) => clientFilters.push(`customer_id.eq.${cid}`));
      }

      const { data: directOrders } = await supabase
        .from('service_orders')
        .select(`
          *,
          customers ( full_name, phone, document_id ),
          devices ( type, brand, model, serial_number )
        `)
        .or(clientFilters.join(','))
        .order('created_at', { ascending: false });

      if (directOrders && directOrders.length > 0) {
        return directOrders.map((ord: any) => ({
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
          customer_name: ord.customers?.full_name || 'Cliente',
          customer_phone: ord.customers?.phone || '',
          customer_document_id: ord.customers?.document_id || '',
          device_info: ord.devices ? `${ord.devices.type || 'Equipo'} · ${ord.devices.brand || ''} ${ord.devices.model || ''}`.trim() : 'Equipo',
        }));
      }
    } catch (directErr) {}

    // 2.3 Fallback adicional en localStorage
    try {
      const storedStr = localStorage.getItem('prorepair_local_orders');
      if (storedStr) {
        const localOrders: ServiceOrder[] = JSON.parse(storedStr);
        const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
        const matched = localOrders.filter((o) => {
          const cleanCode = (o.tracking_code || '').toUpperCase().replace(/^#/, '');
          const targetCode = cleanQuery.replace(/^#/, '');
          return (
            cleanCode === targetCode ||
            (o.tracking_code || '').toUpperCase() === cleanQuery ||
            (o.customer_document_id || '').toUpperCase() === cleanQuery ||
            o.id === cleanQuery ||
            (digitsOnly.length >= 3 && cleanCode.includes(digitsOnly))
          );
        });
        if (matched.length > 0) {
          return matched;
        }
      }
    } catch (e) {}
  }

  return [];
}

// =======================================================
// GESTIÓN DE CLIENTES Y EQUIPOS (REAL SUPABASE)
// =======================================================

export async function createCustomer(customerData: {
  full_name: string;
  phone: string;
  document_id?: string;
  email?: string;
}): Promise<Customer> {
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;
  if (!shopId) throw new Error('Debe iniciar sesión para registrar clientes.');

  const { data, error } = await supabase
    .from('customers')
    .insert([{
      shop_id: shopId,
      full_name: customerData.full_name.trim(),
      phone: customerData.phone.trim(),
      document_id: customerData.document_id?.trim() || null,
      email: customerData.email?.trim() || null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCustomerDevicesAndOrders(customerId: string): Promise<{
  devices: Device[];
  orders: ServiceOrder[];
}> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return { devices: [], orders: [] };

    const { data: devicesData } = await supabase
      .from('devices')
      .select('*')
      .eq('shop_id', shopId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const { data: rawOrders } = await supabase
      .from('service_orders')
      .select(`
        *,
        devices ( type, brand, model, serial_number )
      `)
      .eq('shop_id', shopId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const orders = (rawOrders || []).map((ord: any) => ({
      id: ord.id,
      shop_id: ord.shop_id,
      tracking_code: ord.tracking_code,
      device_id: ord.device_id,
      customer_id: ord.customer_id,
      status: ord.status,
      reported_fault: ord.reported_fault,
      technical_diagnosis: ord.technical_diagnosis,
      final_price: ord.final_price,
      created_at: ord.created_at,
      device_info: ord.devices ? `${ord.devices.type} · ${ord.devices.brand} ${ord.devices.model}` : 'Equipo',
    }));

    return {
      devices: devicesData || [],
      orders: orders || [],
    };
  } catch (err) {
    return { devices: [], orders: [] };
  }
}

// =======================================================
// GESTIÓN DE INVENTARIO Y STOCK (REAL SUPABASE)
// =======================================================

export async function createInventoryItem(itemData: {
  sku: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  cost?: number;
  price: number;
}): Promise<InventoryItem> {
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;
  if (!shopId) throw new Error('Debe iniciar sesión para agregar repuestos.');

  const { data, error } = await supabase
    .from('inventory')
    .insert([{
      shop_id: shopId,
      sku: itemData.sku.trim(),
      name: itemData.name.trim(),
      category: itemData.category.trim(),
      stock: Math.max(0, itemData.stock),
      min_stock: Math.max(0, itemData.min_stock),
      cost: itemData.cost || 0,
      price: itemData.price || 0,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryStock(itemId: string, newStock: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: Math.max(0, newStock) })
      .eq('id', itemId);

    return !error;
  } catch (err) {
    return false;
  }
}

// =======================================================
// GESTIÓN DE DISPOSITIVOS Y EQUIPOS (REAL SUPABASE)
// =======================================================

export async function fetchDevices(): Promise<(Device & { customer_name?: string; customer_phone?: string })[]> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return [];

    const { data: rawDevices, error } = await supabase
      .from('devices')
      .select(`
        *,
        customers ( full_name, phone )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !rawDevices) return [];

    return rawDevices.map((d: any) => ({
      id: d.id,
      shop_id: d.shop_id,
      customer_id: d.customer_id,
      type: d.type,
      brand: d.brand,
      model: d.model,
      serial_number: d.serial_number || '',
      custom_attributes: d.custom_attributes || {},
      created_at: d.created_at,
      customer_name: d.customers?.full_name || 'Cliente sin nombre',
      customer_phone: d.customers?.phone || '',
    }));
  } catch (err) {
    console.error('Error al obtener dispositivos:', err);
    return [];
  }
}

export async function createDevice(deviceData: {
  customer_id: string;
  type: string;
  brand: string;
  model: string;
  serial_number?: string;
  custom_attributes?: Record<string, any>;
}): Promise<Device> {
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;
  if (!shopId) throw new Error('Debe iniciar sesión para registrar equipos.');

  const { data, error } = await supabase
    .from('devices')
    .insert([{
      shop_id: shopId,
      customer_id: deviceData.customer_id,
      type: deviceData.type.trim(),
      brand: deviceData.brand.trim(),
      model: deviceData.model.trim(),
      serial_number: deviceData.serial_number?.trim() || null,
      custom_attributes: deviceData.custom_attributes || {},
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDevice(
  deviceId: string,
  deviceData: {
    type?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    custom_attributes?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const updatePayload: any = {};
    if (deviceData.type !== undefined) updatePayload.type = deviceData.type.trim();
    if (deviceData.brand !== undefined) updatePayload.brand = deviceData.brand.trim();
    if (deviceData.model !== undefined) updatePayload.model = deviceData.model.trim();
    if (deviceData.serial_number !== undefined) updatePayload.serial_number = deviceData.serial_number.trim() || null;
    if (deviceData.custom_attributes !== undefined) updatePayload.custom_attributes = deviceData.custom_attributes;

    const { error } = await supabase
      .from('devices')
      .update(updatePayload)
      .eq('id', deviceId);

    return !error;
  } catch (err) {
    return false;
  }
}

export async function fetchDeviceHistory(deviceId: string): Promise<{
  device: (Device & { customer_name?: string; customer_phone?: string }) | null;
  orders: ServiceOrder[];
}> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) return { device: null, orders: [] };

    const { data: deviceData } = await supabase
      .from('devices')
      .select(`
        *,
        customers ( full_name, phone )
      `)
      .eq('shop_id', shopId)
      .eq('id', deviceId)
      .maybeSingle();

    if (!deviceData) return { device: null, orders: [] };

    const formattedDevice = {
      id: deviceData.id,
      shop_id: deviceData.shop_id,
      customer_id: deviceData.customer_id,
      type: deviceData.type,
      brand: deviceData.brand,
      model: deviceData.model,
      serial_number: deviceData.serial_number || '',
      custom_attributes: deviceData.custom_attributes || {},
      created_at: deviceData.created_at,
      customer_name: deviceData.customers?.full_name || 'Cliente',
      customer_phone: deviceData.customers?.phone || '',
    };

    const { data: rawOrders } = await supabase
      .from('service_orders')
      .select(`
        *,
        customers ( full_name, phone, document_id )
      `)
      .eq('shop_id', shopId)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    const formattedOrders: ServiceOrder[] = (rawOrders || []).map((ord: any) => ({
      id: ord.id,
      shop_id: ord.shop_id,
      tracking_code: ord.tracking_code,
      device_id: ord.device_id,
      customer_id: ord.customer_id,
      technician_id: ord.technician_id,
      status: ord.status,
      reported_fault: ord.reported_fault,
      technical_diagnosis: ord.technical_diagnosis,
      internal_notes: ord.internal_notes,
      estimated_completion: ord.estimated_completion,
      estimated_cost: ord.estimated_cost,
      final_price: ord.final_price,
      warranty_period: ord.warranty_period,
      warranty_until: ord.warranty_until,
      delivered_at: ord.delivered_at,
      created_at: ord.created_at,
      customer_name: ord.customers?.full_name || 'Cliente',
      customer_phone: ord.customers?.phone || '',
      customer_document_id: ord.customers?.document_id || '',
      device_info: `${deviceData.type} · ${deviceData.brand} ${deviceData.model}`,
    }));

    return {
      device: formattedDevice,
      orders: formattedOrders,
    };
  } catch (err) {
    return { device: null, orders: [] };
  }
}

// =======================================================
// GESTIÓN DE REPUESTOS EN CUSTODIA (ORDER_SPARES)
// =======================================================

export async function fetchOrderSpares(orderId: string): Promise<OrderSpare[]> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId || !orderId) return [];

    const { data, error } = await supabase
      .from('order_spares')
      .select('*')
      .eq('shop_id', shopId)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    return [];
  }
}

export async function assignSpareToOrder(payload: {
  order_id: string;
  device_id?: string;
  inventory_item_id: string;
  quantity?: number;
}): Promise<OrderSpare | null> {
  try {
    const profile = await getCurrentUserProfile();
    const shopId = profile?.shop_id || profile?.id;
    if (!shopId) throw new Error('Debe iniciar sesión para asignar repuestos.');

    const qty = payload.quantity || 1;

    // 1. Consultar el repuesto en el inventario
    const { data: item } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', payload.inventory_item_id)
      .maybeSingle();

    if (!item) throw new Error('El repuesto no existe en el inventario.');

    // 2. Crear el registro en order_spares (estado 'reserved' = almacenado en equipo)
    const { data: spareRecord, error: spareErr } = await supabase
      .from('order_spares')
      .insert([{
        shop_id: shopId,
        order_id: payload.order_id,
        device_id: payload.device_id || null,
        inventory_item_id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: qty,
        unit_cost: item.cost || 0,
        unit_price: item.price || 0,
        status: 'reserved',
      }])
      .select()
      .single();

    if (spareErr) throw spareErr;

    // 3. Descontar del stock disponible y aumentar el stock reservado en inventario
    const newStock = Math.max(0, (item.stock || 0) - qty);
    const newReserved = (item.reserved_stock || 0) + qty;

    await supabase
      .from('inventory')
      .update({ stock: newStock, reserved_stock: newReserved })
      .eq('id', item.id);

    return spareRecord;
  } catch (err) {
    console.error('Error al asignar repuesto a la orden:', err);
    return null;
  }
}

export async function returnSpareToInventory(spareId: string): Promise<boolean> {
  try {
    const { data: spare } = await supabase
      .from('order_spares')
      .select('*')
      .eq('id', spareId)
      .maybeSingle();

    if (!spare) return false;

    // 1. Cambiar estado a 'returned'
    await supabase
      .from('order_spares')
      .update({ status: 'returned', updated_at: new Date().toISOString() })
      .eq('id', spareId);

    // 2. Reintegrar la cantidad al stock disponible de inventario
    if (spare.inventory_item_id) {
      const { data: item } = await supabase
        .from('inventory')
        .select('stock, reserved_stock')
        .eq('id', spare.inventory_item_id)
        .maybeSingle();

      if (item) {
        const restoredStock = (item.stock || 0) + spare.quantity;
        const restoredReserved = Math.max(0, (item.reserved_stock || 0) - spare.quantity);

        await supabase
          .from('inventory')
          .update({ stock: restoredStock, reserved_stock: restoredReserved })
          .eq('id', spare.inventory_item_id);
      }
    }

    return true;
  } catch (err) {
    console.error('Error al devolver repuesto al inventario:', err);
    return false;
  }
}
