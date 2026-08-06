import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained build output (only the files actually needed at
  // runtime, with a minimal `node_modules`) — what the Dockerfile's
  // final stage copies. Vercel ignores this and uses its own bundler.
  output: "standalone",
};

export default nextConfig;
