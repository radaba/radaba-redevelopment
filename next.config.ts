import type { NextConfig } from "next";
import { validateBuildEnvironment } from "./src/server/environment/contract.mjs";

validateBuildEnvironment(process.env);

const nextConfig: NextConfig = {
  output: "standalone",
  generateBuildId: async () => process.env.BUILD_ID || "development-unversioned",
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default nextConfig;
