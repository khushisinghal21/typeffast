import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Point to monorepo root so standalone build traces all dependencies correctly
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["./ui"],
  // Skip ESLint during production build (eslint not in prod dependencies)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};
export default nextConfig;
