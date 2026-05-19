# Logic Flow

_Last audited: 2026-05-19 (stream ingest + hook handler ref)._


Key execution paths and control flows in `fe-mycourse`. Covers auth, token lifecycle, data fetching, and form submission patterns.

---

## 1. Login Flow

```
User clicks "Login" button
  ↓
useAuthStore.openLoginModal()   [src/store/auth/auth.ts]
  → authAction = "login"
  ↓
LoginSignupPopup renders LoginContent   [src/components/common/auth-menu/auth/]
  ↓
User fills form (email + password + rememberMe)
  ↓
react-hook-form validates via zodResolver(loginSchema)   [src/schema/auth/auth.ts]
  → validation errors shown inline if invalid (i18n keys from useTranslations("auth"))
  ↓
onSubmit -> handleAuthSubmit("login", values) -> loginAction(payload)   [src/actions/auth/auth.ts]  "use server"
  ↓
loginService(payload)   [src/api/callers/auth/auth.ts]
  → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
  → returns { data: ApiResponse<LoginResponse>, cookies: Set-Cookie parsed }
  ↓
Server Action reads response:
  - data.code === ApiErrorCode.Success?
    YES → set 3 cookies on browser via next/headers cookies().set():
            access_token   (non-HttpOnly, so client can attach to Authorization header)
            refresh_token  (non-HttpOnly, maxAge=30d if rememberMe)
            session_id     (non-HttpOnly, same maxAge as refresh_token)
          → return { success: true, message, code }
    NO  → return { success: false, message, code }
  ↓
Client receives AuthActionResult:
  - success=true  → mutateMe() [invalidate SWR cache] → useAuthStore.closeAllModals()
                    → redirect to nextLink if set
  - success=false → display error message (sonner toast or inline)
```

---

## 2. Token Refresh Flow (Transparent, client-side)

Handled automatically in `src/api/instance.ts` response interceptor.

```
Any apiInstance request fails with 401 or 403
  ↓
Interceptor checks refresh conditions:
  - X-Token-Expired: "true", OR
  - 401 with missing/empty Authorization bearer while refresh cookies exist
  If neither condition matches -> re-throw error
  ↓
  PRESENT →
    isRefreshing === true?  → queue request into pendingResolvers (mutex prevents stampede)
    isRefreshing === false? →
      isRefreshing = true
      ↓
      rawPost(API_PUBLIC_ROUTES.auth.refresh, null, headers: {
        X-Refresh-Token: refresh_token cookie,
        X-Session-Id:    session_id cookie
      })
      ↓
      Refresh succeeds?
        YES → new access_token, refresh_token received
              → setCookieValue("access_token", newToken)
              → setCookieValue("refresh_token", newRefreshToken)
              → flushRefreshQueue(newAccessToken) → retry all queued requests
              → retry original failed request with new token
        NO  → flushRefreshQueue(null) → reject all queued requests
              
```

**Important notes:**
- Refresh mutex uses module-level `isRefreshing` + `pendingResolvers` array — prevents N parallel requests all triggering N refresh calls.
- On server (SSR/Server Component), each request is isolated — no shared module state between different users.
- `rawPost` (not `apiInstance.post`) is used for the refresh call to avoid interceptor recursion.

---

## 3. Current User (Me) Fetch Flow

```
App boots → AppProviders renders
  ↓
SWRConfig wraps the tree   [src/components/providers/app-providers.tsx]
  ↓
MeSwrSync component mounts → useSyncMeFromAuth()   [src/hooks/auth/use-auth-store.ts]
  ↓
useAuth() runs   [src/api/hooks/auth/useAuth.ts]
  → useSWR(getMeEndpointKey, getMeService, { revalidateOnFocus: true, shouldRetryOnError: false })
  ↓
getMeService()   [src/api/callers/auth/auth.ts]
  → apiFetch(getMeEndpointKey)
  → GET /api/v1/me with access_token cookie attached by interceptor
  ↓
  401 response? → return null (user not logged in — no error thrown)
  Other error?  → throw (network error, 5xx)
  200 response? → return MeResponse
  ↓
useSyncMeFromAuth:
  useEffect([me, isLoading, error, mutate]) → useMeStore.syncFromUseAuth({ me, isLoading, error, mePermissions, mutate })
  ↓
All components read via useGetMe():
  → useMeStore(useShallow(...)) → { me, isLoading, isError, mePermissions, mutateMe }
```

**SWR revalidation triggers:**
- Window focus (automatic)
- `mutateMe()` called explicitly after login/logout

---

## 4. Form Submission Pattern

Standard pattern for all forms (login, signup, future forms):

```
1. Define Zod schema in src/schema/<domain>/<form>.ts
   → validation message = i18n key (NOT hardcoded string)
   → export inferred type: export type XFormValues = z.infer<typeof xSchema>

2. useForm<XFormValues>({ resolver: zodResolver(xSchema) })
   → register / Controller for each field
   → formState.errors for inline error display (translate key via useTranslations())

3. handleSubmit(onSubmit) → onSubmit receives validated data

4. onSubmit calls a Server Action (not a direct API call from client):
   const result = await xAction(data)

5. Handle result:
   - result.success → update UI, mutate SWR if needed, navigate or close modal
   - !result.success → display result.message (toast or inline error)
```

---

## 5. Auth Modal State Flow

```
openLoginModal(nextPath?)  → authAction="login",  nextLink=nextPath
openSignupModal(nextPath?) → authAction="signup", nextLink=nextPath
closeAllModals()           → authAction="none",   nextLink=null

LoginSignupPopup renders:
  authAction === "login"  → show LoginContent
  authAction === "signup" → show SignupContent
  authAction === "none"   → unmount / hidden

LoginContent ↔ SignupContent:
  → Switch tab → setAuthAction("signup") / setAuthAction("login")
```

---

## 6. Authorization / Permission Check Pattern

```
Current user's permissions are in: useGetMe().mePermissions (string[])

Check example:
  const { mePermissions } = useGetMe()
  const canManageRBAC = mePermissions.includes(BASIC_ACTIONS.RBAC_MANAGE)

BASIC_ACTIONS constants  [src/constants/actions.ts]  mirror BE RBAC permission strings.

If user is not logged in: mePermissions = [] → all checks return false.
```

---

## 7. i18n Text Resolution Flow

```
next-intl middleware (src/proxy.ts)
  → detects locale from URL prefix (/vi/... or /en/...)
  → sets locale cookie / header

Server Component or Client Component:
  → useTranslations("namespace") or getTranslations("namespace")
  → returns typed translation function t("key")

Message files: src/messages/vi.json, src/messages/en.json

Convention:
  → Zod validation messages = i18n key strings (e.g. "validation.email")
  → Components translate at render time: t(error.message)
```

---

## 8. API Error Global Capture Flow

```
Any apiInstance request fails (error response) on client
  ↓
Axios response interceptor in src/api/instance.ts
  -> useApiError.getState().push({ statusCode, appCode, message, url, method })
  ↓
Error is re-thrown so callers can still catch it locally.

Components can subscribe to the global error store:
  const { lastError, errors, clear } = useApiError()
  → show toast / banner / error overlay based on lastError
```

---

## 9. Stream Event Ingest Flow

```
EventsStreamProvider mounts (client)
  ↓
startStreamEventTransports()
  ├─ broadcast: ensureBroadcastChannel + onmessage
  ├─ sse: fetchEventSource(url) if NEXT_PUBLIC_STREAM_SSE_URL set
  ├─ websocket: ReconnectingWebSocket if NEXT_PUBLIC_STREAM_WS_URL set
  └─ gRPC: fetch NDJSON GET if NEXT_PUBLIC_STREAM_GRPC_BASE_URL set
  ↓
Transport receives raw message
  ↓
publishRawStreamPayload(raw, defaultSource?)
  ↓
normalizeInboundEnvelope(raw, { defaultSource, nextSeq })
  ├─ inboundSchema (source?, type, payload, metadata?)
  ├─ buildMetadata → timestamp, seq, code (makeStreamEventCode)
  └─ buildTypedStreamEvent → Zod payload per inboundPayloadBySource[source][type]
  ↓
If null → stop (invalid / unknown type)
  ↓
useStreamEventsStore.push(event)
  ↓
emitStreamEventToSubscribers(event)
  ↓
useStreamEvent / useWebSocketStreamEvent / … filters by source/type → handler
  (handler kept fresh via useEffect + ref inside useStreamEvent only)

WebSocket-only branch after publish:
  if event.type === "ping" → postSocketOutbound({ type: "pong", payload: { id } })
```

Allowed inbound types by source (see `src/events/core/normalize-inbound.ts`):

| source | types |
|--------|--------|
| `broadcast` | `logout`, `confirm_success` |
| `sse` | `notification`, `hello`, `pong` |
| `websocket` | `notification`, `hello`, `ping`, `pong` |
| `gRPC` | `notification`, `hello` |
