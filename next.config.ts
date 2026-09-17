import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Lock Turbopack to this app root (avoids watching sibling monorepo / multi-root workspaces). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const nextConfig: NextConfig = {
  /**
   * `uuid`@14 and `next-intl`'s client entry ship ESM-only files. Next's
   * bundlers already handle that, but `next/jest` only lets Jest transform
   * node_modules packages listed here (it refuses to relax its own default
   * ignore rule otherwise), so this is also required for `src/lib/utils/uuid.ts`
   * and any `next-intl` client import to be importable from a Jest test.
   */
  transpilePackages: [
    "uuid",
    "next-intl",
    "use-intl",
    "@formatjs/fast-memoize",
    "@formatjs/icu-messageformat-parser",
    "@formatjs/icu-skeleton-parser",
    "@formatjs/intl-localematcher",
    "intl-messageformat",
    "@schummar/icu-type-parser",
    "icu-minify",
  ],
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      canvas: "./src/lib/stubs/canvas.ts",
    },
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
