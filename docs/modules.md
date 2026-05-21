# Modules (`fe-mycourse`)

_Last audited: 2026-05-21 (full source vs docs sync)._


## Module map
- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`
- `Auth`: `src/actions/auth`, `src/components/common/auth-menu`, `src/schema/auth`, `src/types/auth`
- `Api`: `src/api`, `src/constants/api-route.ts`, `src/types/api.ts`
- `Events`: `src/events`, `src/hooks/events`, `src/store/events`, `src/types/events`, `src/config/events`
- `State`: `src/store` (auth, language, api-error, events), `src/hooks/auth`, `src/hooks/language`
- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages`
- `Shared`: `src/lib/utils`, `src/constants`, `src/config`

## Responsibilities
- `Ui` renders pages/sections and calls hooks/actions.
- `Auth` handles login/signup flows and auth modal behavior.
- `Api` centralizes HTTP transport, retries, and endpoint access.
- `Events` manages realtime transports (BroadcastChannel, SSE, WebSocket, NDJSON gRPC), normalization, and hook subscriptions.
- `State` stores auth modal state, `/me` sync, **language** (`useLanguageStore`), API errors, and stream event log.
- `Routing + i18n` controls locale-prefixed navigation and message loading.
- `Shared` exposes reusable helpers/types/constants (`lib/language`, `constants/browse-menu.ts`, …).

## Authorization constants & hooks

- **Constants**: `PERMISSIONS` (40 names), `PERMISSION_IDS` (P1–P40), `ROLES` in `src/constants/` — mirror BE `AllPermissions` and role tags.
- **Types**: `PermissionName`, `PermissionId`, `RoleName`, `PERMISSION_NAME_TO_ID` in `src/types/permissions/`.
- **Utils**: `src/lib/utils/permission.ts` — `hasAllPermissions` matches BE `RequirePermission` (AND semantics).
- **Hooks**: `src/hooks/auth/use-permissions.ts` — `useHasPermission`, `useHasAllPermissions`, `useHasAnyPermissions` over `useGetMe().mePermissions`.
- **Note**: `MeResponse` has `permissions: string[]` only; no `roles[]` on `/me` yet — gate UI by permission, not role name alone.

## Cross-module contracts
- `Auth UI -> actions/auth -> api/callers` for login/signup submit.
- `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync.
- `api/instance` depends on `lib/utils/cookie` for isomorphic token read/write.
- `AppProviders -> EventsStreamProvider -> events/registry` starts transports; transports call `events/core/publish` → `store/events`.
- Feature UI listens via `hooks/events/*` (never import transports directly except outbound helpers).

## Events module detail

See [`delivery.md`](./delivery.md) and [`folder-structure.md`](./folder-structure.md) (`src/events/` tree).
