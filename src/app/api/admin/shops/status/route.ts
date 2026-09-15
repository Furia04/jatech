import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifySuperAdminUser } from '@/lib/supabase/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

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
    const { shopId, status, active } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Falta shopId' }, { status: 400 });
    }

    const isActive = Boolean(active);
    const subscriptionStatus = status || (isActive ? 'active' : 'canceled');

    // 1. Intentar actualizar directamente en shops por id
    const { data: updatedShops, error: updateErr } = await supabaseAdmin
      .from('shops')
      .update({
        subscription_status: subscriptionStatus,
        active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId)
      .select();

    if (updateErr) {
      console.warn('Advertencia al actualizar shops por ID en API status:', updateErr);
    }

    // 2. Si no actualizó ninguna fila o hubo error, buscar perfil en users y hacer upsert
    if (!updatedShops || updatedShops.length === 0) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`id.eq.${shopId},shop_id.eq.${shopId}`)
        .maybeSingle();

      const upsertPayload: any = {
        id: shopId,
        subscription_status: subscriptionStatus,
        active: isActive,
        plan_price: 20000,
        updated_at: new Date().toISOString(),
      };

      if (userProfile) {
        upsertPayload.name = userProfile.full_name ? `Taller de ${userProfile.full_name}` : `Taller (${userProfile.email})`;
        upsertPayload.owner_email = userProfile.email;
      }

      const { error: upsertErr } = await supabaseAdmin
        .from('shops')
        .upsert([upsertPayload], { onConflict: 'id' });

      if (upsertErr) {
        console.error('Error al hacer upsert de taller en API status:', upsertErr);
        throw upsertErr;
      }
    }

    return NextResponse.json({
      success: true,
      shopId,
      status: subscriptionStatus,
      active: isActive,
    });
  } catch (err: any) {
    console.error('Error al actualizar estado de suscripción en /api/admin/shops/status:', err);
    return NextResponse.json(
      { error: err?.message || 'Error al actualizar estado del taller' },
      { status: 500 }
    );
  }
}
