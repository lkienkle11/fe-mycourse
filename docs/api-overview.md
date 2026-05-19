# API Overview (`fe-mycourse`)

_Last audited: 2026-05-15 (GitNexus + source scan)._


## Scope
Frontend API layer lives in `src/api/` and is used by `src/actions/` and client hooks.

## Layers
- `src/api/instance.ts`: Axios instance, auth header attach, refresh flow.
- `src/api/methods.ts`: typed helpers `apiFetch/apiPost/apiPut/apiDelete/apiOptions`.
- `src/api/raw-http.ts`: raw HTTP helpers for refresh path.
- `src/api/callers/auth/auth.ts`: domain callers (`loginService`, `getMeService`).
- `src/api/hooks/auth/useAuth.ts`: SWR hook for `/api/v1/me`.

## Contracts
- Response envelope: `ApiResponse<T>` in `src/types/api.ts`.
- Low-level helper return type: `ApiResult<T>` with `data/statusCode/headers/cookies`.
- Error code map: `ApiErrorCode`.

## Auth routes used
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register` — register / resend confirmation (`registerAction`, `registerService`)
- `POST /api/v1/auth/confirm` — confirm email and issue tokens (`confirmAction`, `confirmService`)
- `POST /api/v1/auth/refresh`
- `GET /api/v1/me`

## Rules
- Do not call `axios` directly in features.
- Use constants from `src/constants/api-route.ts`.
- Use `raw*` helpers only for refresh/low-level paths.
