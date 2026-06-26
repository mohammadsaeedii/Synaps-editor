/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The design-system components carry their own ESLint-clean source; we keep
  // the production build focused on type-safety and skip lint as a gate.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
