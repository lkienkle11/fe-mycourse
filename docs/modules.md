# Modules (`fe-mycourse`)

_Last audited: 2026-05-19 (Events module)._


## Module map
- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`
- `Auth`: `src/actions/auth`, `src/components/common/auth-menu`, `src/schema/auth`, `src/types/auth`
- `Api`: `src/api`, `src/constants/api-route.ts`, `src/types/api.ts`
- `Events`: `src/events`, `src/hooks/events`, `src/store/events`, `src/types/events`, `src/config/events`
- `State`: `src/store`, `src/hooks/auth/use-auth-store.ts`
- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages`
- `Shared`: `src/lib/utils`, `src/constants`, `src/config`

## Responsibilities
- `Ui` renders pages/sections and calls hooks/actions.
- `Auth` handles login/signup flows and auth modal behavior.
- `Api` centralizes HTTP transport, retries, and endpoint access.
- `Events` manages realtime transports (BroadcastChannel, SSE, WebSocket, NDJSON gRPC), normalization, and hook subscriptions.
- `State` stores auth modal state, me state sync, API error aggregation, and stream event log.
- `Routing + i18n` controls locale-prefixed navigation and message loading.
- `Shared` exposes reusable helpers/types/constants.

## Cross-module contracts
- `Auth UI -> actions/auth -> api/callers` for login/signup submit.
- `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync.
- `api/instance` depends on `lib/utils/cookie` for isomorphic token read/write.
- `AppProviders -> EventsStreamProvider -> events/registry` starts transports; transports call `events/core/publish` → `store/events`.
- Feature UI listens via `hooks/events/*` (never import transports directly except outbound helpers).

## Events module detail

See [`delivery.md`](./delivery.md) and [`folder-structure.md`](./folder-structure.md) (`src/events/` tree).
