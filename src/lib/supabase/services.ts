import { supabase } from './client';
import { Customer, Device, DeviceCategoryTemplate, ExtraJob, ExtraJobStatus, CreateExtraJobInput, InventoryItem, OrderSpare, PartOrder, ServiceOrder, Shop, UserProfile } from '@/types';

// =======================================================
// OBTENER PERFIL Y TALLER (TENANT) DEL USUARIO AUTENTICADO
// =======================================================

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const cleanEmail = (user.email || '').toLowerCase().trim();

    // 1. Intentar consultar el perfil de la tabla 'users'
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let resolvedShopId = data?.shop_id || user.user_metadata?.shop_id;
    let resolvedRole = data?.role || user.user_metadata?.role || 'owner';
    let resolvedFullName = data?.full_name || user.user_metadata?.full_name || user.email;

    // 2. Si shop_id no existe o es igual a user.id, verificar si hay un taller registrado con este email
    if (!resolvedShopId || resolvedShopId === user.id) {
      const { data: shopByEmail } = await supabase
        .from('shops')
        .select('id, name')
        .or(`owner_email.eq.${cleanEmail},id.eq.${user.id}`)
        .maybeSingle();

      if (shopByEmail?.id) {
        resolvedShopId = shopByEmail.id;
      } else {
        resolvedShopId = user.id;
      }
    }

    const resolvedProfile: UserProfile = {
      id: user.id,
      email: cleanEmail,
      role: resolvedRole as any,
      shop_id: resolvedShopId,
      full_name: resolvedFullName,
      can_view_financials: data?.can_view_financials ?? true,
    };

    // 3. Auto-sincronizar en la tabla 'users' si no existía o faltaba data
    if (!data || data.shop_id !== resolvedShopId) {
      try {
        await supabase.from('users').upsert([{
          id: user.id,
          email: cleanEmail,
          role: resolvedRole,
          shop_id: resolvedShopId,
          full_name: resolvedFullName,
          can_view_financials: true,
        }], { onConflict: 'id' });
      } catch (syncErr) {
        // Silencioso en caso de restricciones RLS
      }
    }

    return resolvedProfile;
  } catch (err) {
    return null;
  }
}

export async function fetchCurrentShop(): Promise<Shop | null> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return null;

    const targetShopId = profile.shop_id || profile.id;
    const cleanEmail = (profile.email || '').toLowerCase().trim();

    const { data: dbShop } = await supabase
      .from('shops')
      .select('*')
      .or(`id.eq.${targetShopId},owner_email.eq.${cleanEmail}`)
      .maybeSingle();

    if (!dbShop) {
      return {
        id: targetShopId,
        name: profile.full_name ? `Taller de ${profile.full_name}` : 'Mi Taller',
        owner_email: profile.email,
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        settings: {},
      };
    }

    return {
      id: dbShop.id,
      name: dbShop.name || 'Mi Taller',
      owner_email: dbShop.owner_email || profile.email,
      subscription_status: dbShop.subscription_status || 'active',
      plan_price: Number(dbShop.plan_price) || 20000,
      active: dbShop.active ?? true,
      mp_preapproval_id: dbShop.mp_preapproval_id,
      trial_ends_at: dbShop.trial_ends_at,
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

export async function deleteShopAsAdmin(shopId: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/admin/shops?id=${encodeURIComponent(shopId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return true;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al eliminar taller');
    }

    const { error } = await supabase
      .from('shops')
      .delete()
      .eq('id', shopId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error en deleteShopAsAdmin:', err);
    throw err;
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

    return dbOrders;
  } catch (err) {
    console.error('Error general en fetchServiceOrders:', err);
    return [];
  }
}

export async function createServiceOrderWithDevice(orderPayload: {
  customer: { id?: string; full_name: string; phone: string; document_id?: string; email?: string };
  device: { id?: string; type: string; brand: string; model: string; serial_number?: string; custom_attributes?: any };
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
  let customerId = orderPayload.customer.id || '';
  if (!customerId && orderPayload.customer.document_id) {
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

  // 3. Insertar o reutilizar Dispositivo
  let deviceId = orderPayload.device.id || '';
  if (!deviceId) {
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
    deviceId = newDevice.id;
  }

  // 4. Insertar Orden de Servicio con el Código de Seguimiento Exacto
  let finalTrackingCode = orderPayload.order.tracking_code?.trim() || `#WO-${Math.floor(1000 + Math.random() * 9000)}`;
  if (!finalTrackingCode.startsWith('#')) {
    finalTrackingCode = `#${finalTrackingCode}`;
  }

  const baseOrderPayload: any = {
    shop_id: shopId,
    tracking_code: finalTrackingCode,
    device_id: deviceId,
    customer_id: customerId,
    status: 'recibido',
    reported_fault: orderPayload.order.reported_fault || 'Revisión técnica',
    estimated_cost: Number(orderPayload.order.estimated_cost) || 0,
    final_price: Number(orderPayload.order.final_price) || Number(orderPayload.order.estimated_cost) || 0,
    advance_payment: Number(orderPayload.order.advance_payment) || 0,
    payment_method: orderPayload.order.payment_method || 'efectivo',
    device_photos: Array.isArray(orderPayload.order.device_photos) ? orderPayload.order.device_photos : [],
  };

  let newOrder: any = null;

  // Intento 1: Inserción completa con todas las columnas
  const { data: ordData1, error: ordErr1 } = await supabase
    .from('service_orders')
    .insert([baseOrderPayload])
    .select()
    .single();

  if (!ordErr1 && ordData1) {
    newOrder = ordData1;
  } else {
    console.warn('Intento 1 de inserción de orden falló, reintentando:', ordErr1?.message || ordErr1);
    const isEnumError = ordErr1?.message?.toLowerCase().includes('order_status') || ordErr1?.message?.toLowerCase().includes('enum') || ordErr1?.code === '22P02';

    // Intento 2: Sin columnas auxiliares y omitiendo status si dio error de enum
    const essentialPayload: any = {
      shop_id: shopId,
      tracking_code: finalTrackingCode,
      device_id: deviceId,
      customer_id: customerId,
      reported_fault: orderPayload.order.reported_fault || 'Revisión técnica',
      estimated_cost: Number(orderPayload.order.estimated_cost) || 0,
      final_price: Number(orderPayload.order.final_price) || 0,
    };
    if (!isEnumError) {
      essentialPayload.status = 'recibido';
    }

    const { data: ordData2, error: ordErr2 } = await supabase
      .from('service_orders')
      .insert([essentialPayload])
      .select()
      .single();

    if (!ordErr2 && ordData2) {
      newOrder = ordData2;
    } else {
      console.warn('Intento 2 falló, verificando colisión de código o esquema básico:', ordErr2?.message || ordErr2);

      // Intento 3: Código nuevo garantizado único y sin status enum restrictivo
      const uniqueCode = `#WO-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      essentialPayload.tracking_code = uniqueCode;
      delete essentialPayload.status;

      const { data: ordData3, error: ordErr3 } = await supabase
        .from('service_orders')
        .insert([essentialPayload])
        .select()
        .single();

      if (!ordErr3 && ordData3) {
        newOrder = ordData3;
      } else {
        console.error('Error definitivo al insertar orden de servicio en Supabase:', ordErr3 || ordErr2 || ordErr1);
        throw ordErr3 || ordErr2 || ordErr1;
      }
    }
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

export async function deleteServiceOrder(orderId: string, trackingCode?: string): Promise<boolean> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;

  // 1. Eliminar de localStorage si existe
  if (typeof window !== 'undefined') {
    try {
      const storedStr = localStorage.getItem('prorepair_local_orders');
      if (storedStr) {
        const localOrders = JSON.parse(storedStr);
        const filtered = localOrders.filter((o: any) => o.id !== orderId && o.tracking_code !== (trackingCode || orderId));
        localStorage.setItem('prorepair_local_orders', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Error al eliminar orden de localStorage:', e);
    }
  }

  // 2. Eliminar de Supabase
  try {
    let query = supabase.from('service_orders').delete();
    if (isUuid) {
      query = query.eq('id', orderId);
    } else if (trackingCode) {
      query = query.eq('tracking_code', trackingCode);
    } else {
      query = query.eq('tracking_code', orderId);
    }

    if (shopId && profile?.role !== 'superadmin') {
      query = query.eq('shop_id', shopId);
    }

    const { error } = await query;
    if (error) {
      console.error('Error al eliminar orden en Supabase:', error);
      throw error;
    }
    return true;
  } catch (err) {
    if (!isUuid) return true;
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
  condition?: 'nuevo' | 'usado';
  condition_grade?: string;
  source_notes?: string;
}): Promise<InventoryItem> {
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;
  if (!shopId) throw new Error('Debe iniciar sesión para agregar repuestos.');

  const basePayload: any = {
    shop_id: shopId,
    sku: itemData.sku.trim(),
    name: itemData.name.trim(),
    category: itemData.category.trim(),
    stock: Math.max(0, itemData.stock),
    min_stock: Math.max(0, itemData.min_stock),
    cost: itemData.cost || 0,
    price: itemData.price || 0,
    condition: itemData.condition || 'nuevo',
    condition_grade: itemData.condition_grade || null,
    source_notes: itemData.source_notes || null,
  };

  const { data, error } = await supabase
    .from('inventory')
    .insert([basePayload])
    .select()
    .single();

  if (error) {
    if (error.message?.includes('condition') || error.code === '42703') {
      console.warn('Columnas de condición no presentes en base de datos, reintentando inserción básica:', error.message);
      delete basePayload.condition;
      delete basePayload.condition_grade;
      delete basePayload.source_notes;
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('inventory')
        .insert([basePayload])
        .select()
        .single();
      if (fallbackError) throw fallbackError;
      return { ...fallbackData, condition: itemData.condition || 'nuevo' };
    }
    throw error;
  }
  return data;
}

export async function updateInventoryItem(
  itemId: string,
  itemData: {
    sku?: string;
    name?: string;
    category?: string;
    stock?: number;
    min_stock?: number;
    cost?: number;
    price?: number;
    condition?: 'nuevo' | 'usado';
    condition_grade?: string;
    source_notes?: string;
  }
): Promise<InventoryItem> {
  const profile = await getCurrentUserProfile();
  const shopId = profile?.shop_id || profile?.id;
  if (!shopId) throw new Error('Debe iniciar sesión para editar repuestos.');

  const updatePayload: any = {};
  if (itemData.sku !== undefined) updatePayload.sku = itemData.sku.trim();
  if (itemData.name !== undefined) updatePayload.name = itemData.name.trim();
  if (itemData.category !== undefined) updatePayload.category = itemData.category.trim();
  if (itemData.stock !== undefined) updatePayload.stock = Math.max(0, itemData.stock);
  if (itemData.min_stock !== undefined) updatePayload.min_stock = Math.max(0, itemData.min_stock);
  if (itemData.cost !== undefined) updatePayload.cost = itemData.cost;
  if (itemData.price !== undefined) updatePayload.price = itemData.price;
  if (itemData.condition !== undefined) updatePayload.condition = itemData.condition;
  if (itemData.condition_grade !== undefined) updatePayload.condition_grade = itemData.condition_grade;
  if (itemData.source_notes !== undefined) updatePayload.source_notes = itemData.source_notes;

  let query = supabase.from('inventory').update(updatePayload).eq('id', itemId);
  if (shopId && profile?.role !== 'superadmin') {
    query = query.eq('shop_id', shopId);
  }

  const { data, error } = await query.select().single();
  if (error) {
    if (error.message?.includes('condition') || error.code === '42703') {
      delete updatePayload.condition;
      delete updatePayload.condition_grade;
      delete updatePayload.source_notes;
      let retryQuery = supabase.from('inventory').update(updatePayload).eq('id', itemId);
      if (shopId && profile?.role !== 'superadmin') {
        retryQuery = retryQuery.eq('shop_id', shopId);
      }
      const { data: retryData, error: retryError } = await retryQuery.select().single();
      if (retryError) throw retryError;
      return { ...retryData, condition: itemData.condition || 'nuevo' };
    }
    throw error;
  }
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

export async function deleteInventoryItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error al eliminar item de inventario:', error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Error en deleteInventoryItem:', err);
    throw err;
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

// =======================================================
// PEDIDOS DE REPUESTOS / ENCARGOS (PART_ORDERS)
// =======================================================

export async function fetchPartOrders(): Promise<PartOrder[]> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return [];

    let query = supabase
      .from('part_orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Si no es superadmin, filtrar por shop_id
    if (profile.role !== 'superadmin') {
      const shopId = profile.shop_id || profile.id;
      query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al consultar part_orders en Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      shop_id: row.shop_id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      part_name: row.part_name,
      device_model: row.device_model || '',
      advance_payment: Number(row.advance_payment || 0),
      expected_price: Number(row.expected_price || 0),
      status: row.status || 'pending',
      notes: row.notes || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.error('Error general en fetchPartOrders:', err);
    return [];
  }
}

export async function createPartOrder(
  data: Omit<PartOrder, 'id' | 'created_at' | 'updated_at'>
): Promise<PartOrder | null> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) throw new Error('No hay sesión de usuario activa.');

    const shopId = data.shop_id || profile.shop_id || profile.id;

    const payload = {
      shop_id: shopId,
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.trim(),
      part_name: data.part_name.trim(),
      device_model: data.device_model ? data.device_model.trim() : null,
      advance_payment: data.advance_payment || 0,
      expected_price: data.expected_price || 0,
      status: data.status || 'pending',
      notes: data.notes ? data.notes.trim() : null,
    };

    const { data: inserted, error } = await supabase
      .from('part_orders')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Error al insertar part_order en Supabase:', error);
      throw error;
    }

    return {
      id: inserted.id,
      shop_id: inserted.shop_id,
      customer_name: inserted.customer_name,
      customer_phone: inserted.customer_phone,
      part_name: inserted.part_name,
      device_model: inserted.device_model || '',
      advance_payment: Number(inserted.advance_payment || 0),
      expected_price: Number(inserted.expected_price || 0),
      status: inserted.status || 'pending',
      notes: inserted.notes || '',
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
    };
  } catch (err) {
    console.error('Error en createPartOrder:', err);
    throw err;
  }
}

export async function updatePartOrder(
  id: string,
  updates: Partial<PartOrder>
): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.customer_name !== undefined) payload.customer_name = updates.customer_name.trim();
    if (updates.customer_phone !== undefined) payload.customer_phone = updates.customer_phone.trim();
    if (updates.part_name !== undefined) payload.part_name = updates.part_name.trim();
    if (updates.device_model !== undefined) payload.device_model = updates.device_model.trim();
    if (updates.advance_payment !== undefined) payload.advance_payment = updates.advance_payment;
    if (updates.expected_price !== undefined) payload.expected_price = updates.expected_price;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes.trim();

    const { error } = await supabase
      .from('part_orders')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar part_order en Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error en updatePartOrder:', err);
    return false;
  }
}

export async function deletePartOrder(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('part_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar part_order en Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error en deletePartOrder:', err);
    return false;
  }
}

// =======================================================
// SERVICIOS PARA TRABAJOS EXTRA / SERVICIOS EN TERRENO
// =======================================================

export async function fetchExtraJobs(): Promise<ExtraJob[]> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) return [];

    const shopId = profile.shop_id || profile.id;
    const { data: rawJobs, error } = await supabase
      .from('extra_jobs')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al consultar extra_jobs en Supabase:', error);
      return [];
    }

    if (!rawJobs || rawJobs.length === 0) return [];

    // Enriquecer con clientes y técnicos
    const customerIds = Array.from(new Set(rawJobs.map((j: any) => j.customer_id).filter(Boolean)));
    const technicianIds = Array.from(new Set(rawJobs.map((j: any) => j.technician_id).filter(Boolean)));

    const customerMap = new Map<string, any>();
    const technicianMap = new Map<string, any>();

    if (customerIds.length > 0) {
      const { data: custs } = await supabase
        .from('customers')
        .select('id, full_name, phone, document_id, email')
        .in('id', customerIds);
      custs?.forEach((c: any) => customerMap.set(c.id, c));
    }

    if (technicianIds.length > 0) {
      const { data: techs } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', technicianIds);
      techs?.forEach((t: any) => technicianMap.set(t.id, t));
    }

    return rawJobs.map((job: any) => {
      const cust = customerMap.get(job.customer_id);
      const tech = job.technician_id ? technicianMap.get(job.technician_id) : null;

      return {
        id: job.id,
        shop_id: job.shop_id,
        job_code: job.job_code || `EXT-${job.id.slice(0, 4).toUpperCase()}`,
        customer_id: job.customer_id,
        technician_id: job.technician_id,
        title: job.title,
        description: job.description || '',
        location_address: job.location_address || '',
        scheduled_at: job.scheduled_at,
        status: job.status as ExtraJobStatus,
        labor_price: Number(job.labor_price || 0),
        materials_price: Number(job.materials_price || 0),
        total_price: Number(job.total_price || 0),
        advance_payment: Number(job.advance_payment || 0),
        payment_method: job.payment_method || 'efectivo',
        technical_notes: job.technical_notes || '',
        created_at: job.created_at,
        updated_at: job.updated_at,
        customer_name: cust?.full_name || 'Cliente sin nombre',
        customer_phone: cust?.phone || '',
        customer_document_id: cust?.document_id || '',
        customer_email: cust?.email || '',
        technician_name: tech?.full_name || tech?.email || '',
      };
    });
  } catch (err) {
    console.error('Error crítico en fetchExtraJobs:', err);
    return [];
  }
}

export async function createExtraJob(input: CreateExtraJobInput): Promise<ExtraJob> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) throw new Error('Usuario no autenticado.');

    const shopId = profile.shop_id || profile.id;

    // Generar código correlativo EXT-001, EXT-002, etc.
    const { data: existingJobs } = await supabase
      .from('extra_jobs')
      .select('job_code')
      .eq('shop_id', shopId);

    let nextNumber = 1;
    if (existingJobs && existingJobs.length > 0) {
      const numbers = existingJobs
        .map((j) => {
          const match = j.job_code?.match(/EXT-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      } else {
        nextNumber = existingJobs.length + 1;
      }
    }
    const job_code = `EXT-${String(nextNumber).padStart(3, '0')}`;

    const labor = Number(input.labor_price || 0);
    const materials = Number(input.materials_price || 0);
    const total = input.total_price !== undefined ? Number(input.total_price) : labor + materials;

    const payload = {
      shop_id: shopId,
      job_code,
      customer_id: input.customer_id,
      technician_id: input.technician_id || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      location_address: input.location_address?.trim() || null,
      scheduled_at: input.scheduled_at || null,
      status: input.status || 'presupuestado',
      labor_price: labor,
      materials_price: materials,
      total_price: total,
      advance_payment: Number(input.advance_payment || 0),
      payment_method: input.payment_method || 'efectivo',
      technical_notes: input.technical_notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('extra_jobs')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Error al insertar extra_job en Supabase:', error);
      throw error;
    }

    // Obtener datos del cliente para la respuesta
    const { data: cust } = await supabase
      .from('customers')
      .select('full_name, phone, document_id, email')
      .eq('id', inserted.customer_id)
      .maybeSingle();

    return {
      id: inserted.id,
      shop_id: inserted.shop_id,
      job_code: inserted.job_code,
      customer_id: inserted.customer_id,
      technician_id: inserted.technician_id,
      title: inserted.title,
      description: inserted.description,
      location_address: inserted.location_address,
      scheduled_at: inserted.scheduled_at,
      status: inserted.status as ExtraJobStatus,
      labor_price: Number(inserted.labor_price || 0),
      materials_price: Number(inserted.materials_price || 0),
      total_price: Number(inserted.total_price || 0),
      advance_payment: Number(inserted.advance_payment || 0),
      payment_method: inserted.payment_method,
      technical_notes: inserted.technical_notes,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
      customer_name: cust?.full_name || '',
      customer_phone: cust?.phone || '',
      customer_document_id: cust?.document_id || '',
      customer_email: cust?.email || '',
    };
  } catch (err) {
    console.error('Error en createExtraJob:', err);
    throw err;
  }
}

export async function updateExtraJob(
  id: string,
  updates: Partial<ExtraJob>
): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title?.trim() || null;
    if (updates.description !== undefined) payload.description = updates.description ? updates.description.trim() : null;
    if (updates.location_address !== undefined) payload.location_address = updates.location_address ? updates.location_address.trim() : null;
    if (updates.scheduled_at !== undefined) payload.scheduled_at = updates.scheduled_at;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.labor_price !== undefined) payload.labor_price = Number(updates.labor_price);
    if (updates.materials_price !== undefined) payload.materials_price = Number(updates.materials_price);
    if (updates.total_price !== undefined) payload.total_price = Number(updates.total_price);
    if (updates.advance_payment !== undefined) payload.advance_payment = Number(updates.advance_payment);
    if (updates.payment_method !== undefined) payload.payment_method = updates.payment_method;
    if (updates.technical_notes !== undefined) payload.technical_notes = updates.technical_notes ? updates.technical_notes.trim() : null;
    if (updates.technician_id !== undefined) payload.technician_id = updates.technician_id;
    if (updates.customer_id !== undefined) payload.customer_id = updates.customer_id;

    const { error } = await supabase
      .from('extra_jobs')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar extra_job en Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error en updateExtraJob:', err);
    return false;
  }
}

export async function updateExtraJobStatus(
  id: string,
  status: ExtraJobStatus
): Promise<boolean> {
  return updateExtraJob(id, { status });
}

export async function deleteExtraJob(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('extra_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar extra_job en Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error en deleteExtraJob:', err);
    return false;
  }
}


