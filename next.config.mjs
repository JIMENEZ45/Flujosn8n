/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que un warning de lint tumbe el deploy en Vercel
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
