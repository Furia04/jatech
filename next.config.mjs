/** @type {import('next').NextConfig} */

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.mercadopago.com https://http2.mlstatic.com https://*.mercadopago.com https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.supabase.co https://*.mercadopago.com https://*.mlstatic.com https://http2.mlstatic.com https://images.unsplash.com https://offsalenotebook.com.ar;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com https://va.vercel-scripts.com https://vitals.vercel-insights.com;
  frame-src 'self' https://*.mercadopago.com https://www.mercadopago.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.mercadopago.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/gestion-tecnicos',
        destination: '/GestionTecnicos',
      },
      {
        source: '/gestion-tecnicos/:path*',
        destination: '/GestionTecnicos/:path*',
      },
      {
        source: '/sat/:path*',
        destination: '/GestionTecnicos/:path*',
      },
      {
        source: '/dashboard/:path*',
        destination: '/GestionTecnicos/dashboard/:path*',
      },
      {
        source: '/orders/:path*',
        destination: '/GestionTecnicos/orders/:path*',
      },
      {
        source: '/customers/:path*',
        destination: '/GestionTecnicos/customers/:path*',
      },
      {
        source: '/inventory/:path*',
        destination: '/GestionTecnicos/inventory/:path*',
      },
      {
        source: '/devices/:path*',
        destination: '/GestionTecnicos/devices/:path*',
      },
      {
        source: '/settings/:path*',
        destination: '/GestionTecnicos/settings/:path*',
      },
      {
        source: '/track',
        destination: '/GestionTecnicos/track',
      },
      {
        source: '/track/:path*',
        destination: '/GestionTecnicos/track/:path*',
      },
    ];
  },
};

export default nextConfig;
