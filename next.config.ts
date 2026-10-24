import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Dev only: lets phones/tablets on the local network load the interactive
  // scripts (Next.js blocks non-localhost dev origins by default). Add your
  // PC's LAN IP here if it changes (see `ipconfig`).
  allowedDevOrigins: ["192.168.8.7", "172.16.31.113", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
