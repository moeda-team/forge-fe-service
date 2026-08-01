import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const sharedConfig = {};

export default function nextConfig(phase) {
  return {
    ...sharedConfig,
    // Keep development chunks isolated from `next build`. Sharing `.next`
    // lets a production build delete files that the hot reloader still uses.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
