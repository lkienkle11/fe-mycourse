/**
 * Draft security header map aligned with docs/deploy.md nginx.
 * Inactive CSP — do not enable without One Tap / OAuth / media / proxy review.
 */

export type SecurityHeaderMap = Readonly<Record<string, string>>;

/** Matches current nginx add_header examples in docs/deploy.md. */
export const NGINX_ALIGNED_SECURITY_HEADERS: SecurityHeaderMap = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Draft CSP — intentionally inactive.
 * HSTS belongs on the reverse proxy, not as a substitute for this map.
 */
export const CSP_DRAFT_INACTIVE = {
  enabled: false as const,
  /** Placeholder only — not for production use. */
  value:
    "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'",
  notes: [
    "Review Google One Tap, OAuth popup, media/embed CDNs, and report-uri before enabling.",
    "X-Frame-Options does not replace CSP frame-ancestors.",
    "HSTS is configured at TLS/nginx layer — see docs/deploy.md.",
  ],
} as const;

export function draftSecurityHeaders(options?: {
  includeInactiveCsp?: boolean;
}): SecurityHeaderMap {
  if (options?.includeInactiveCsp && CSP_DRAFT_INACTIVE.enabled) {
    return {
      ...NGINX_ALIGNED_SECURITY_HEADERS,
      "Content-Security-Policy": CSP_DRAFT_INACTIVE.value,
    };
  }
  return NGINX_ALIGNED_SECURITY_HEADERS;
}
