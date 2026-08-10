/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/tournament/play/:preset(T10|T20|ODI)",
        destination: "/tournament/play/new",
        permanent: false,
      },
      // Nested game/[fixtureId] next to game/page 404s under Next 16 / Turbopack.
      {
        source: "/tournament/play/custom/:id/game/:fixtureId",
        destination: "/tournament/play/custom/:id/match/:fixtureId",
        permanent: false,
      },
    ];
  },
  // Same-origin Firebase Auth handler (fixes Google redirect on Vercel).
  // Pair with NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-vercel-host> in production.
  async rewrites() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    if (!projectId) return [];
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${projectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/live/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
}

export default nextConfig
