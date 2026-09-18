"use client";

import { useSyncExternalStore } from "react";
import { routing } from "@/i18n/routing";
import { homeHref } from "@/lib/navigation/home";
import enMessages from "@/messages/en";
import viMessages from "@/messages/vi";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Only the copy this boundary needs — no `useTranslations`/provider dependency. */
const BOUNDARY_COPY = {
  en: enMessages.errors.boundary,
  vi: viMessages.errors.boundary,
} as const;

type SupportedLocale = keyof typeof BOUNDARY_COPY;

const DEFAULT_LOCALE = routing.defaultLocale as SupportedLocale;

/** First path segment (e.g. `/en/...` → `"en"`) — `routing.localePrefix` is `"always"`, so a normal request always has one. */
function detectLocaleFromPathname(pathname: string): SupportedLocale {
  const segment = pathname.split("/")[1];
  return segment && segment in BOUNDARY_COPY
    ? (segment as SupportedLocale)
    : DEFAULT_LOCALE;
}

function subscribeToNothing() {
  return () => {};
}

/** Client-only external state read — `useSyncExternalStore` re-syncs it after mount without a manual `useEffect(() => setState(...))`. */
function getPathnameSnapshot(): string {
  return window.location.pathname;
}

/** Matches the client's pre-hydration render so there is nothing to reconcile. */
function getServerPathnameSnapshot(): string {
  return "";
}

/**
 * Inline (not `<img>`/`next/image`) so the mascot can never fail a network
 * fetch — this boundary must stay renderable even if every static asset is
 * unreachable. A friendly, slightly broken robot: one plain eye, one "x"
 * eye, and a spark off its antenna reads as "something short-circuited"
 * without needing any copy to explain it.
 */
function BrokenRobotMascot() {
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line
        x1="60"
        y1="8"
        x2="60"
        y2="22"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60 4 L64 10 L58 10 L62 16"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="16"
        y="22"
        width="88"
        height="72"
        rx="20"
        fill="#eef2ff"
        stroke="#c7d2fe"
        strokeWidth="2"
      />
      <circle cx="43" cy="56" r="7" fill="#4338ca" />
      <path
        d="M70 50 L82 62 M82 50 L70 62"
        stroke="#4338ca"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M42 76 Q60 68 78 76"
        stroke="#4338ca"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="32" y="94" width="56" height="16" rx="8" fill="#c7d2fe" />
      <rect x="6" y="52" width="12" height="20" rx="6" fill="#c7d2fe" />
      <rect x="102" y="52" width="12" height="20" rx="6" fill="#c7d2fe" />
    </svg>
  );
}

/**
 * Root-level boundary for an error escaping every segment boundary, including
 * the root layout itself. Replaces `RootLayout` entirely when active, so it
 * owns its own `<html>`/`<body>` and deliberately skips the `next-intl`
 * provider, fonts, and data fetching — anything that could itself throw and
 * leave a blank page. Locale-aware copy still works without that provider:
 * the plain message objects are imported directly (no React context needed),
 * and the locale is read from the URL path via `useSyncExternalStore` —
 * matching `routing.localePrefix: "always"` — with `routing.defaultLocale`
 * as the safe fallback for the server/pre-hydration snapshot and any
 * unrecognized path shape. The "back to homepage" action is a plain `<a>`
 * (not `Link` from `@/i18n/navigation`), for the same "cannot itself throw"
 * reason `next-intl` isn't used anywhere else in this file.
 */
export default function GlobalError({ reset }: GlobalErrorProps) {
  const pathname = useSyncExternalStore(
    subscribeToNothing,
    getPathnameSnapshot,
    getServerPathnameSnapshot,
  );
  const locale = detectLocaleFromPathname(pathname);
  const t = BOUNDARY_COPY[locale];
  const homeUrl = `/${locale}${homeHref === "/" ? "" : homeHref}`;

  return (
    <html lang={locale}>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          backgroundColor: "#f8fafc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
            maxWidth: "26rem",
            width: "100%",
            textAlign: "center",
            padding: "3rem 2.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "1.25rem",
            boxShadow:
              "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
          }}
        >
          <BrokenRobotMascot />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                margin: 0,
                color: "#0f172a",
              }}
            >
              {t.title}
            </h1>
            <p style={{ color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              {t.description}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                borderRadius: "0.75rem",
                padding: "0.75rem 1.75rem",
                fontWeight: 500,
                fontSize: "0.95rem",
                backgroundColor: "#111827",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.retry}
            </button>
            <a
              href={homeUrl}
              style={{
                borderRadius: "0.75rem",
                padding: "0.75rem 1.75rem",
                fontWeight: 500,
                fontSize: "0.95rem",
                backgroundColor: "transparent",
                color: "#111827",
                border: "1px solid #cbd5e1",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {t.backToHome}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
