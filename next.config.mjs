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
