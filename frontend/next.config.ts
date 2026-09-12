import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.7.13.60'],
  turbopack: {},
};

export default withPWAConfig(nextConfig);