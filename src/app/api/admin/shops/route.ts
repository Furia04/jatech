import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Shop } from '@/types';
import { verifySuperAdminUser } from '@/lib/supabase/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function GET() {
  try {
    const authCheck = await verifySuperAdminUser();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'No autorizado' },
        { status: authCheck.statusCode || 401 }
      );
    }
    const { data: dbShops, error: shopsErr } = await supabaseAdmin
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopsErr) {
      console.warn('Error al consultar tabla shops en Supabase Admin API:', shopsErr);
    }

    const { data: dbUsers, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersErr) {
      console.warn('Error al consultar tabla users en Supabase Admin API:', usersErr);
    }

    const { data: ordersData } = await supabaseAdmin
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

    return NextResponse.json({ shops: Array.from(shopMap.values()) });
  } catch (err: any) {
    console.error('Error crítico en GET /api/admin/shops:', err);
    return NextResponse.json({ error: err?.message || 'Error al obtener talleres' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verifySuperAdminUser();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'No autorizado' },
        { status: authCheck.statusCode || 401 }
      );
    }

    const body = await request.json();
    const { name, owner_email, plan_price, subscription_status, active } = body;

    if (!name || !owner_email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('shops')
      .insert([{
        name: name.trim(),
        owner_email: owner_email.trim().toLowerCase(),
        subscription_status: subscription_status || 'active',
        plan_price: Number(plan_price) || 20000,
        active: active ?? true,
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, shop: data });
  } catch (err: any) {
    console.error('Error en POST /api/admin/shops:', err);
    return NextResponse.json({ error: err?.message || 'Error al crear taller' }, { status: 500 });
  }
}
