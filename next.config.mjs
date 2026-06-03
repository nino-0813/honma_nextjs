/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' },
      { protocol: 'https', hostname: '*.supabase.in', pathname: '/storage/v1/**' },
    ],
  },
  // Vercel の rewrites は vercel.json で行う想定（online → www リダイレクト等）
  async redirects() {
    return [
      // 旧URL /ambassador → 新URL /join-us（恒久301）
      { source: '/ambassador', destination: '/join-us', permanent: true },
    ];
  },
};

export default nextConfig;
