import type { NextConfig } from "next";
import redirectMap from "./scripts/redirect-map.json";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  async redirects() {
    const contentRedirects = Object.entries(redirectMap).map(
      ([source, destination]) => ({
        source,
        destination: destination.replace(/^\/Hard_Working/, ""),
        permanent: true,
      }),
    );

    return [
      {
        source: "/Hard_Working",
        destination: "/",
        permanent: true,
      },
      {
        source: "/Hard_Working/:path*",
        destination: "/:path*",
        permanent: true,
      },
      ...contentRedirects,
    ];
  },
};

export default nextConfig;
