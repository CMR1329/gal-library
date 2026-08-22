import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "cdn.anilist.co" },
      { protocol: "https", hostname: "t.vndb.org" },
      { protocol: "https", hostname: "images.vndb.org" },
    ],
  },
};

export default nextConfig;
