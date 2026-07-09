"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

function getHasOpenerSnapshot() {
  return Boolean(window.opener);
}

function getHasOpenerServerSnapshot() {
  return false;
}

interface OAuthPopupCallbackRelayProps {
  messageType: string;
  completingLabel: string;
  idleLabel: string;
}

function OAuthPopupCallbackRelayContent({
  messageType,
  completingLabel,
  idleLabel,
}: OAuthPopupCallbackRelayProps) {
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
        type: messageType,
        code: payload.code,
        state: payload.state,
        error: payload.error,
      },
      window.location.origin,
    );
    window.close();
  }, [hasOpener, messageType, payload]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <p className="text-sm text-black/80">
          {hasOpener ? completingLabel : idleLabel}
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

export function OAuthPopupCallbackRelay(props: OAuthPopupCallbackRelayProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-sm text-black/80">{props.completingLabel}</p>
        </main>
      }
    >
      <OAuthPopupCallbackRelayContent {...props} />
    </Suspense>
  );
}
