import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/GestionTecnicos/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error || errorDescription) {
    const loginUrl = new URL('/GestionTecnicos/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error || 'auth_error');
    if (errorDescription) loginUrl.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const cookieStore = {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
      },
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

    const response = NextResponse.redirect(new URL(next, requestUrl.origin));

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data?.user) {
      // Auto-provisionar o verificar perfil y taller
      const user = data.user;
      const cleanEmail = (user.email || '').toLowerCase().trim();
      const fullName = user.user_metadata?.full_name || cleanEmail;
      const shopName = user.user_metadata?.shop_name || `Taller de ${fullName}`;

      try {
        // Verificar si ya existe taller
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .or(`id.eq.${user.id},owner_email.eq.${cleanEmail}`)
          .maybeSingle();

        const targetShopId = existingShop?.id || user.id;

        if (!existingShop) {
          // Crear taller con prueba de 14 días activa
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('shops').insert([{
            id: targetShopId,
            name: shopName,
            owner_email: cleanEmail,
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt,
            plan_price: 20000,
            active: true,
          }]);
        }

        // Crear o actualizar perfil en users
        await supabase.from('users').upsert([{
          id: user.id,
          email: cleanEmail,
          full_name: fullName,
          role: 'owner',
          shop_id: targetShopId,
          can_view_financials: true,
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Error en auto-provisioning de auth callback:', err);
      }

      return response;
    }
  }

  // Fallback a login o destino
  return NextResponse.redirect(new URL('/GestionTecnicos/login', requestUrl.origin));
}
