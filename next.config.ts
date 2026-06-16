import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-ical", "web-push"],
  experimental: {
    // Les uploads (images news, photos remontées) passent par des Server Actions.
    // Limite par défaut = 1 Mo → relevée. Filet de sécurité : les images sont
    // aussi compressées côté client (cf. src/lib/image.ts) avant envoi.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
