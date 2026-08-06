import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained build output (only the files actually needed at
  // runtime, with a minimal `node_modules`) — what the Dockerfile's
  // final stage copies for self-hosted/Docker deploys. Vercel does its
  // own bundling and its docs explicitly say not to set this — it broke
  // the Vercel build outright, hence gating it on Vercel's own
  // build-time env var (set automatically, never needs configuring).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
