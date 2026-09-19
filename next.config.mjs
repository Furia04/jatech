/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  basePath: '/GestionTecnicos',
  async redirects() {
    return [
      {
        source: '/talleres',
        destination: '/dashboard',
        permanent: false,
      }
    ];
  }
};

export default nextConfig;
