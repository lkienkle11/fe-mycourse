# Coding Patterns and Conventions (`fe-mycourse`)

_Last audited: 2026-05-27 (shared list query; local quality gates)._


Rules and repeatable patterns every developer and AI agent must follow when adding or modifying code in this project.

---

## 1. File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | `kebab-case.tsx` | `auth-layout.tsx` |
| Hooks | `use-kebab-case.ts` | `use-auth-store.ts` |
| Utilities | `kebab-case.ts` | `cookie.ts`, `cn.ts` |
| Type files | `kebab-case.ts` | `api.ts`, `auth.ts` |
| Schema files | `kebab-case.ts` | `auth.ts` |
| Barrel files | always `index.ts` | `src/api/index.ts` |
| Server Actions | `kebab-case.ts` in `src/actions/<domain>/` | `auth.ts` |

---

## 2. Component Patterns

### Server vs Client boundary

Default to **Server Components**. Add `"use client"` only when needed:

| Requires `"use client"` | Stays Server Component |
|------------------------|----------------------|
| React hooks (`useState`, `useEffect`, SWR, Zustand) | Pure rendering (no state/effects) |
| Event handlers (`onClick`, `onSubmit`) | Data fetching via `async` component |
| Radix interactive primitives | Static layout and content |
| `useTranslations` (next-intl client hook) | `getTranslations` (next-intl server function) |

### Component export style

Always named exports — never default exports for components:

```ts
// ✅ Correct
export function AuthLayout() { ... }

// ❌ Wrong
export default function AuthLayout() { ... }
```

### Barrel re-exports

Every feature folder must have an `index.ts` barrel:

```ts
// src/components/common/index.ts
export * from "./header";
export * from "./footer";
export * from "./auth-menu";
```

Consumers import from the barrel, not the implementation file:

```ts
// ✅ Correct
import { Header, Footer } from "@/components/common";

// ❌ Wrong
import { Header } from "@/components/common/header/header";
```

---

## 3. Styling Pattern

### Use `cn()` for conditional classes

```ts
import { cn } from "@/lib/utils";

<div className={cn(
  "base-styles here",
  isActive && "active-styles",
  variant === "outline" && "outline-styles",
)} />
```

### No inline styles

```ts
// ✅ Correct
<div className="flex items-center gap-2 px-4" />

// ❌ Wrong
<div style={{ display: "flex", alignItems: "center" }} />
```

### Tailwind class ordering

Follow the Tailwind CSS recommended order: layout → spacing → sizing → typography → color → effects.

---

## 4. State Management

### Rule: match state type to tool

| State type | Tool | Example |
|------------|------|---------|
| Server data (async, cached) | SWR | `useAuth`, `useCourses` |
| Global UI state (sync, no fetch) | Zustand | `useAuthStore` (modal), `useLanguageStore` (locale label/code), `useApiError`, `useStreamEventsStore` |
| Realtime push (multi-transport) | Events pipeline + hooks | `useWebSocketStreamEvent`, `useSseStreamEvent`, … |
| Local component state | `useState` | Form open/close toggles |
| URL/navigation state | `useRouter` / `usePathname` | Active nav item highlight |

### Zustand: no Provider needed

```ts
// ✅ Correct — import directly, no wrap needed
import { useAuthStore } from "@/store/auth/auth";
const { openLoginModal } = useAuthStore();
```

### Language: store + sync hook (no Context)

`useLocale()` (next-intl) is synced once in `LanguageLocaleSync` → `useLanguageStore`. Client components read via `useCustomLanguage()` (`languageCode`, `locale`, `languageLabel`). Server components use `resolveCustomLanguage(await getLocale())` from `src/lib/language/resolve-language.ts`.

**Locale links:** `LocaleSwitcher` must use `usePathname()` from `@/i18n/navigation` as `href` — never hard-code `href="/"` or switching locale always sends users to home.

### SWR: always use the endpoint key constant

```ts
// src/api/callers/auth/auth.ts
export const getMeEndpointKey = "/api/v1/me"; // defined once

// In hooks or components that need to mutate
import { getMeEndpointKey } from "@/api/callers/auth/auth";
mutate(getMeEndpointKey);
```

---

## 4.1 Stream events

### Listen: channel hooks, not raw socket

```ts
// ✅ Correct
import { useWebSocketStreamEvent } from "@/hooks/events/socket";
useWebSocketStreamEvent("notification", (e) => { /* e is WebSocketStreamEvent */ });

// ❌ Wrong — bypasses normalize + store
ws.onmessage = (ev) => { /* manual JSON */ };
```

`handler` may be an inline function — `useStreamEvent` syncs it in `useEffect`. Do **not** assign `ref.current = handler` during render in custom hooks (eslint-plugin-react-hooks).

### Nhiều handler cho cùng một key (`source` + `type`)

Một event có thể có **nhiều function** xử lý. Dùng `order` (số nhỏ chạy trước). Thứ tự áp dụng **toàn app** (mọi component / mọi lần `subscribeStreamEvents`).

**Cách 1 — một hook, mảng handler** (nên `useMemo` mảng để tránh đăng ký lại mỗi render):

```ts
const handlers = useMemo(
  () => [
    { order: 0, handler: (e) => validateNotification(e) },
    { order: 10, handler: (e) => toast.info(e.payload.title) },
    { order: 20, handler: (e) => analytics.track(e.metadata.code) },
  ],
  [],
);

useWebSocketStreamEvent("notification", handlers);
```

**Cách 2 — nhiều component / nhiều hook**, cùng key, `order` khác nhau:

```ts
// Component A
useWebSocketStreamEvent("notification", {
  order: 0,
  handler: (e) => syncToStore(e),
});

// Component B
useWebSocketStreamEvent("notification", {
  order: 100,
  handler: (e) => showToast(e),
});
```

**Cách 3 — imperative** (ngoài React):

```ts
import { subscribeStreamEvents } from "@/events";

const unsub = subscribeStreamEvents({
  filter: { source: "websocket", type: "notification" },
  order: 5,
  handler: (event) => { /* ... */ },
});
// unsub() khi không cần nữa
```

### Send: typed outbound + metadata helper

```ts
import { postSocketOutbound } from "@/events";
import { nextStreamOutboundMetadata } from "@/events/core/outbound-metadata";

postSocketOutbound({
  source: "websocket",
  type: "ping",
  payload: { id: crypto.randomUUID() },
  metadata: nextStreamOutboundMetadata(),
});
```

### Define new event types

1. Add payload + map entry in `src/types/events/payloads.ts` (or channel-specific `index.ts`).
2. Add Zod schema to `inboundPayloadBySource` in `normalize-inbound.ts`.
3. Update the matching `docs/delivery/*.md` type table.

---

## 5. API Call Pattern

### Never call Axios directly — use `api` wrappers

```ts
// ✅ Correct
import { apiFetch } from "@/api";
const { data, error } = await apiFetch<T>(url);

// ❌ Wrong
import axios from "axios";
const res = await axios.get(url);
```

### Always check both HTTP error and app-level error code

```ts
const { data, error } = await apiFetch<T>(url);
if (error) { /* network/HTTP failure */ }
if (data && data.code !== 0) { /* business logic failure */ }
const payload = data?.data;
```

---

## 6. Forms Pattern

All forms use `react-hook-form` with `zodResolver`:

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/schema/auth/auth";

const form = useForm<LoginValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "", rememberMe: false },
});
```

Validation error messages in schemas must use **i18n keys**, not hard-coded strings:

```ts
// ✅ Correct
z.string().email({ message: "validation.email" })

// ❌ Wrong
z.string().email({ message: "Please enter a valid email" })
```

---

## 7. Internationalization (i18n) Pattern

Translations live in `src/messages/en.ts` and `vi.ts` (`vi` uses `satisfies Messages`). Server bootstrap loads them via `loadMessages` in `src/lib/i18n/load-messages.ts`, called from `src/i18n/request.ts`.

### All user-visible text via `useTranslations`

```ts
import { useTranslations } from "next-intl";
const t = useTranslations("auth"); // namespace
<p>{t("loginTitle")}</p>
```

### Navigation helpers

Always use the typed wrappers from `@/i18n/navigation`:

```ts
import { Link, useRouter } from "@/i18n/navigation"; // ✅ includes locale prefix
import { Link } from "next/link"; // ❌ breaks locale routing
```

### Never hard-code locale strings

```ts
// ✅ Correct
import { routing } from "@/i18n/routing";
const { locales, defaultLocale } = routing;

// ❌ Wrong
const locales = ["en", "vi"];
```

---

## 8. TypeScript Patterns

### Strict mode — no `any`

```ts
// ✅ Correct
function processUser(user: MeResponse): string { ... }

// ❌ Wrong
function processUser(user: any): string { ... }
```

### Type imports

```ts
// ✅ Always use `import type` for type-only imports
import type { MeResponse } from "@/types/auth/auth";
```

### Path aliases

Always use `@/` aliases — never relative path traversal beyond one level:

```ts
// ✅ Correct
import { cn } from "@/lib/utils";

// ❌ Wrong
import { cn } from "../../../../lib/utils/cn";
```

---

## 9. Cookie Handling Pattern

Always use the isomorphic helpers — never access cookies directly:

```ts
import { getCookieValue, setCookieValue } from "@/lib/utils";

// Works in both browser and server context
const token = getCookieValue("access_token");
setCookieValue("access_token", newToken, buildCookieOptions({ ... }));
```

**Server Actions only** — after login/confirm, set auth cookies via:

```ts
import { setAuthSessionCookies } from "@/lib/utils/auth-session"; // not from @/lib/utils barrel
```

`auth-session.ts` uses `next/headers` and `import "server-only"` so it must never be re-exported from the client-safe barrel.

---

## 10. Paginated list query params

Do not redefine `page` / `per_page` / `sort_by` on each module. Use `ApiListQueryParams` from `src/types/api.ts` and `apiListQueryToRecord()` from `src/lib/utils/list-query.ts`:

```ts
import type { ApiListQueryParams } from "@/types/api";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";

export type CourseListFilters = ApiListQueryParams;

const url = buildQueryParams("/api/v1/courses", apiListQueryToRecord(filters));
```

Media lists add optional `category` and `sort_order` on the same type (`MediaListFilters` = `ApiListQueryParams` + narrowed fields). Taxonomy uses `sort_desc`; media uses `sort_order` — both are emitted by `apiListQueryToRecord()` when set.

For human-readable file sizes in the UI, use `formatBytes()` from `src/lib/utils/format-bytes.ts` (exported via `@/lib/utils`). Do not copy byte-formatting logic into feature components.

## 11. Slug fields

Taxonomy slugs are **read-only** in the UI. Derive them with `generateSlug(name)` / `slugifyName(name)` on submit (and show a live preview while typing the name). Normalization includes Vietnamese accent removal, `đ/Đ -> d`, spaces/underscores → `-`, and Unicode-safe filtering. Do not expose an editable slug input.

---

## 12. Adding New Features Checklist

Before writing code for a new feature:

- [ ] Read `docs/` — check architecture, flow, components, patterns
- [ ] Run `npx gitnexus analyze --force` — understand impact
- [ ] For large refactors: `npm run cycles` / `npm run dupl` — see [`quality.md`](./quality.md)
- [ ] Reuse utilities from `src/lib/utils/` (barrel) or direct paths for server-only files (`auth-session.ts`)
- [ ] Place server data fetching in `src/api/callers/<domain>/`
- [ ] Place SWR hooks in `src/api/hooks/<domain>/`
- [ ] Place Server Actions in `src/actions/<domain>/`
- [ ] Place Zustand stores in `src/store/`
- [ ] Add new i18n strings to both `en.ts` and `vi.ts` (keep `vi.ts` satisfying `Messages`)
- [ ] Add route constants to `src/constants/route.ts`
- [ ] Add API route constants to `src/constants/api-route.ts`
- [ ] Update `docs/` after implementation
