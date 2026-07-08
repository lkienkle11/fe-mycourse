"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useSyncExternalStore } from "react";
import { X_OAUTH_MESSAGE_TYPE } from "@/hooks/auth/use-x-login";

function subscribeNoop() {
  return () => {};
}

function getHasOpenerSnapshot() {
  return Boolean(window.opener);
}

function getHasOpenerServerSnapshot() {
  return false;
}

function XOAuthCallbackContent() {
  const searchParams = useSearchParams();
  const hasOpener = useSyncExternalStore(
    subscribeNoop,
    getHasOpenerSnapshot,
    getHasOpenerServerSnapshot,
  );

  const payload = useMemo(() => {
    const code = searchParams.get("code") ?? undefined;
    const state = searchParams.get("state") ?? undefined;
    const error = searchParams.get("error") ?? undefined;
    return { code, state, error };
  }, [searchParams]);

  useEffect(() => {
    if (!hasOpener || !window.opener) return;
    window.opener.postMessage(
      {
        type: X_OAUTH_MESSAGE_TYPE,
        code: payload.code,
        state: payload.state,
        error: payload.error,
      },
      window.location.origin,
    );
    window.close();
  }, [hasOpener, payload]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <p className="text-sm text-black/80">
          {hasOpener
            ? "Completing X sign-in…"
            : "You can close this window and return to MyCourse to sign in."}
        </p>
        {!hasOpener ? (
          <Link href="/" className="text-sm text-[#3DCBB1] underline">
            Back to home
          </Link>
        ) : null}
      </div>
    </main>
  );
}

export default function XOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-sm text-black/80">Completing X sign-in…</p>
        </main>
      }
    >
      <XOAuthCallbackContent />
    </Suspense>
  );
}
