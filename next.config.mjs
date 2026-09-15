/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
