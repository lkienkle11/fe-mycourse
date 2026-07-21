/**
 * Auth runtime adapter types and callback-factory shapes.
 * Isomorphic / client-safe — must not import Next cookie APIs or Node-only request adapters.
 */

export type BrowserRefreshResult =
  | { ok: true; accessToken: string }
  | { ok: false; cause?: unknown };

export type AuthCookieBag = {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
};

export type ReadAuthCookiesFn = () => Promise<AuthCookieBag> | AuthCookieBag;

export type RotatedAuthSessionTokens = {
  access_token: string;
  refresh_token: string;
  session_id: string;
};

export type PersistRotatedAuthSessionFn = (
  tokens: RotatedAuthSessionTokens,
  refreshMaxAge?: number,
) => Promise<void>;

export type RefreshSessionInput = {
  refreshToken: string;
  sessionId: string;
};

export type RefreshSessionResult = {
  tokens: RotatedAuthSessionTokens;
  refreshMaxAge?: number;
};

export type AuthRuntimeAdapter =
  | { kind: "browser-proxy"; refresh: () => Promise<BrowserRefreshResult> }
  | {
      kind: "server-writable";
      readAuthCookies: ReadAuthCookiesFn;
      refresh: (input: RefreshSessionInput) => Promise<RefreshSessionResult>;
      persistRotatedSession: PersistRotatedAuthSessionFn;
    }
  | { kind: "server-readonly"; readAuthCookies: ReadAuthCookiesFn }
  | { kind: "server-no-request-context" };
