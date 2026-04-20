import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the Turbopack/Webpack warning/error
  experimental: {
    turbo: {
      // Turbopack ignores these for now, satisfy the config check
    }
  }
};

export default withPWA(nextConfig);
