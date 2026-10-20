import { resolveSiteConfig } from "@/lib/seo/site-config";

/**
 * Fail fast: a production Node server must not start with a missing or
 * invalid SITE_URL (canonical, hreflang, sitemap, robots all depend on it).
 * Next.js keeps a server alive after a throwing `register()` and answers every
 * request with 500, so the error is logged and the process exits non-zero for
 * PM2 / the container runtime to report.
 * Skipped for `next build` (NEXT_PHASE=phase-production-build), which runs
 * with NODE_ENV=production but without runtime env.
 */
export async function register(): Promise<void> {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    try {
      resolveSiteConfig({ readEnv: true });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
