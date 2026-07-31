import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const sharedConfig = {
  outputFileTracingRoot: fileURLToPath(new URL("./", import.meta.url)),
};

export default function nextConfig(phase) {
  return {
    ...sharedConfig,
    // Keep development chunks isolated from `next build`. Sharing `.next`
    // lets a production build delete files that the hot reloader still uses.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
