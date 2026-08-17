import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker/self-hosted (site/Dockerfile sets
  // NEXT_OUTPUT=standalone). Vercel must NOT use it — it breaks its build.
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
