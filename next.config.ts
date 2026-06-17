import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Lock Turbopack to this app root (avoids watching sibling monorepo / multi-root workspaces). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  logging: {
    /** Stop forwarding browser console to the terminal (reduces dev-server overhead). */
    browserToTerminal: false,
  },
  experimental: {
    /** Cap Turbopack RAM so long dev sessions do not exhaust the machine. */
    turbopackMemoryLimit: 4 * 1024 * 1024 * 1024,
    /**
     * Disable on-disk Turbopack cache in dev — unbounded growth (multi-GB `.next/dev/cache/turbopack`)
     * causes high CPU/RAM from cache I/O. Trade-off: slightly slower cold start after restart.
     */
    turbopackFileSystemCacheForDev: false,
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
