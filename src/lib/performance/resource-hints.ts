/**
 * Preconnect / dns-prefetch descriptor builders.
 * Not injected into layout this phase — callers decide after measurement.
 */

import type { ResourceHint } from "@/types/seo/performance";

function assertHttpsOrigin(href: string): string {
  const url = new URL(href);
  if (url.protocol !== "https:") {
    throw new Error("resource-hint-https-only");
  }
  return url.origin;
}

export function buildPreconnectHint(
  href: string,
  crossOrigin: ResourceHint["crossOrigin"] = "anonymous",
): ResourceHint {
  return {
    rel: "preconnect",
    href: assertHttpsOrigin(href),
    crossOrigin,
  };
}

export function buildDnsPrefetchHint(href: string): ResourceHint {
  return {
    rel: "dns-prefetch",
    href: assertHttpsOrigin(href),
  };
}

/**
 * Default empty — do not preconnect the whole site by default.
 * Future routes append measured origins only.
 */
export function defaultResourceHints(): readonly ResourceHint[] {
  return [];
}
