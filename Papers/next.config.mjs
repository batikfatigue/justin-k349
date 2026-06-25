/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  async redirects() {
    return [
      {
        source: "/Papers",
        destination: "/",
        permanent: false
      },
      {
        source: "/Papers/:path*",
        destination: "/:path*",
        permanent: false
      },
      {
        source: "/papers",
        destination: "/",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
