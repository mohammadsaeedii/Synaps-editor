/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The design-system components carry their own ESLint-clean source; we keep
  // the production build focused on type-safety and skip lint as a gate.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    const apiOrigin = process.env.API_PROXY_ORIGIN || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
