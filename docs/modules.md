# Modules (`fe-mycourse`)

_Last audited: 2026-05-15 (GitNexus + source scan)._


## Module map
- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`
- `Auth`: `src/actions/auth`, `src/components/common/auth-menu`, `src/schema/auth`, `src/types/auth`
- `Api`: `src/api`, `src/constants/api-route.ts`, `src/types/api.ts`
- `State`: `src/store`, `src/hooks/auth/use-auth-store.ts`
- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages`
- `Shared`: `src/lib/utils`, `src/constants`, `src/config`

## Responsibilities
- `Ui` renders pages/sections and calls hooks/actions.
- `Auth` handles login/signup flows and auth modal behavior.
- `Api` centralizes HTTP transport, retries, and endpoint access.
- `State` stores auth modal state, me state sync, and API error aggregation.
- `Routing + i18n` controls locale-prefixed navigation and message loading.
- `Shared` exposes reusable helpers/types/constants.

## Cross-module contracts
- `Auth UI -> actions/auth -> api/callers` for login/signup submit.
- `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync.
- `api/instance` depends on `lib/utils/cookie` for isomorphic token read/write.
