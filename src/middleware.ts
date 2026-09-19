import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedWorkshopRoute =
    pathname.startsWith('/GestionTecnicos/dashboard') ||
    pathname.startsWith('/GestionTecnicos/orders') ||
    pathname.startsWith('/GestionTecnicos/part-orders') ||
    pathname.startsWith('/GestionTecnicos/customers') ||
    pathname.startsWith('/GestionTecnicos/inventory') ||
    pathname.startsWith('/GestionTecnicos/devices') ||
    pathname.startsWith('/GestionTecnicos/settings') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/part-orders') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/devices') ||
    pathname.startsWith('/settings');

  const isApiAdminRoute = pathname.startsWith('/api/admin') || pathname.startsWith('/GestionTecnicos/api/admin');
  const isAdminPageRoute =
    (pathname.startsWith('/GestionTecnicos/admin') && pathname !== '/GestionTecnicos/admin/login') ||
    (pathname.startsWith('/admin') && pathname !== '/admin/login');

  // 1. Redirigir a /GestionTecnicos/login si intenta entrar a rutas del taller sin estar autenticado
  if (isProtectedWorkshopRoute && !user) {
    const loginUrl = new URL('/GestionTecnicos/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Control estricto de Super Administrador en endpoints /api/admin/...
  if (isApiAdminRoute) {
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado: Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    const isSuperAdmin =
      user.user_metadata?.role === 'superadmin' ||
      user.email === 'furiaortiz04@gmail.com' ||
      user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado: Se requieren permisos de Super Administrador.' },
        { status: 403 }
      );
    }
  }

  // 3. Control estricto de Super Administrador en interfaz web (/admin)
  if (isAdminPageRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/GestionTecnicos/admin/login', request.url));
    }

    const isSuperAdmin =
      user.user_metadata?.role === 'superadmin' ||
      user.email === 'furiaortiz04@gmail.com' ||
      user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/GestionTecnicos/admin/login?error=unauthorized', request.url));
    }
  }

  // 4. Si ya está autenticado, no permitir acceso a login o registro
  if (
    (pathname === '/GestionTecnicos/login' ||
     pathname === '/GestionTecnicos/register' ||
     pathname === '/login' ||
     pathname === '/register') &&
    user
  ) {
    return NextResponse.redirect(new URL('/GestionTecnicos/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, icon.svg y archivos de imagen
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
