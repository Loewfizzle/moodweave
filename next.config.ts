import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We develop on 127.0.0.1 (to match the Spotify redirect URI), but Next's
  // dev server is initialized on localhost. Allow 127.0.0.1 to request dev
  // resources (HMR, etc.) so the client bundle loads and hydrates correctly.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
