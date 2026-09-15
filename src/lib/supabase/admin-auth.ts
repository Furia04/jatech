import { createClient } from './server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export interface AdminAuthResult {
  authorized: boolean;
  user: any | null;
  error?: string;
  statusCode?: number;
}

export async function verifySuperAdminUser(): Promise<AdminAuthResult> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        user: null,
        error: 'No autorizado: Debe iniciar sesión.',
        statusCode: 401,
      };
    }

    const isSuperAdminByMeta =
      user.user_metadata?.role === 'superadmin' ||
      user.email === 'furiaortiz04@gmail.com' ||
      (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL);

    if (isSuperAdminByMeta) {
      return { authorized: true, user };
    }

    // Consulta en base de datos con cliente administrativo
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'superadmin') {
      return { authorized: true, user };
    }

    return {
      authorized: false,
      user,
      error: 'Acceso denegado: Se requieren permisos de Super Administrador.',
      statusCode: 403,
    };
  } catch (err: any) {
    return {
      authorized: false,
      user: null,
      error: err?.message || 'Error al validar permisos de administrador.',
      statusCode: 500,
    };
  }
}
