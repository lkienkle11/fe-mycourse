# Code quality tools (`fe-mycourse`)

_Last audited: 2026-05-29 (constants + types ESLint rules documented)._

Checks for **circular imports** (Madge), **duplicate code** (jscpd), and **ESLint** under `src/`. jscpd **skips** [`src/components/ui/`](../src/components/ui/) (shadcn upstream primitives — shared design system, not feature duplication). On push to **`dev`**, CI runs `npm run quality:deps` then **`npm run lint`** in the **`test`** job **before** `npm run build` (see [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml)).

> **Not the backend:** `be-mycourse` uses `make check-architecture` / `make check-dupl` (Go). This repo uses **npm scripts** below.

---

## When to run

| Situation | Suggested command |
|-----------|-------------------|
| Before a large refactor or PR touching many modules | `npm run quality:deps` |
| After changing import paths or barrel `index.ts` files | `npm run cycles` |
| After copying UI blocks or API helpers | `npm run dupl` |
| Machine-readable cycle report | `npm run cycles:json` |

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `lint` | `eslint` | ESLint (Next.js `core-web-vitals` + `typescript`; project rules in [`eslint.config.mjs`](../eslint.config.mjs)) |
| `lint:biome` | `biome check .` | Biome format/lint (local / pre-PR; **not** in CI `test` job) |
| `cycles` | `madge --circular … src` | Detect circular **static** import chains under `src/` |
| `cycles:json` | Same + `--json` | JSON output for tooling |
| `dupl` | `jscpd src --config .jscpd.json` | Duplicate code detection (excludes paths in `ignore`; see below) |
| `quality:deps` | `npm run cycles && npm run dupl` | Run both Madge + jscpd gates in sequence |

Madge reads path aliases from `tsconfig.json` (`@/*` → `./src/*`) via `--ts-config ./tsconfig.json`.

Configuration: [`.jscpd.json`](../.jscpd.json). Reports are written to `.jscpd-report/` (gitignored).

---

## Exit codes

| Tool | Exit 0 | Exit non-zero |
|------|--------|----------------|
| **madge** (`cycles`) | No circular dependencies | At least one cycle (prints chain, e.g. `a.ts > b.ts > a.ts`) |
| **jscpd** (`dupl`) | Duplication **below** `threshold` (80% of analyzed lines) | Duplication at or above threshold |

jscpd may still **print** clone pairs on success (informational). Failures list clones that exceed the global threshold.

---

## jscpd settings (summary)

| Option | Value | Meaning |
|--------|-------|---------|
| `threshold` | `80` | Fail if duplicated lines ≥ 80% of project (not per-file) |
| `minLines` | `10` | Ignore clones shorter than 10 lines |
| `minTokens` | `100` | Ignore token-small clones |
| `reporters` | `console`, `json` | Terminal + `.jscpd-report/jscpd-report.json` |
| `ignore` | build artifacts, lockfiles, `*.d.ts`, **`src/components/ui/**`** | See [`.jscpd.json`](../.jscpd.json) |

### Ignored paths (intentional)

| Pattern | Reason |
|---------|--------|
| `**/src/components/ui/**` | shadcn/ui primitives from upstream (`npx shadcn add`); shared across the app — not copy-paste debt in feature code |
| `**/.next/**`, `**/node_modules/**`, … | Generated / vendor / lockfiles |

**Do not** lower `threshold` / `minLines` to hide duplication in feature code — extract shared modules instead (see refactors below).

---

## ESLint (`eslint.config.mjs`)

Extends **`eslint-config-next`** (`core-web-vitals` + `typescript`). Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.

### `src/constants/**` — data-only constants

Files under `src/constants/` must hold **plain values only** (no runtime logic in constants modules):

| Rule | Forbidden in `src/constants/**/*.ts` |
|------|--------------------------------------|
| File type | `.tsx` files |
| Functions | declarations, expressions, arrow functions, methods, object methods |
| Types | `type` aliases, `interface`, exporting types |
| Exports | exporting functions or type-only exports |

Put helpers in `src/lib/utils/` and types in `src/types/`. `import type` from types into constants is fine when building typed constant objects.

**2026-05-29 refactor (constants):** `isImageFilename` / extension helpers → `src/lib/utils/media.ts`; taxonomy config types → `src/types/taxonomy/`; `getTaxonomyResourceConfig` / `getTaxonomySearchableColumns` → `src/lib/utils/taxonomy.ts`.

### `src/types/**` — type-only modules

Files under `src/types/` must hold **types/interfaces only** (no runtime logic):

| Rule | Forbidden in `src/types/**/*.ts` |
|------|----------------------------------|
| File type | `.tsx` files |
| Runtime values | `const`, `let`, `var`, assignments |
| Functions | declarations, expressions, arrow functions |
| Exports | `export *`, default exports, non-type named exports |
| Imports | value imports except from `@/constants/**` (for derived types like `PermissionName`, `ApiErrorCodeValue`) |

Allowed: `export type`, `interface`, `export type * from`, `declare module "next-intl"` in `i18n.d.ts`.

**2026-05-29 refactor (types):** `ApiErrorCode` → `src/constants/api-error-code.ts`; `isApiSuccess` → `src/lib/utils/api.ts`; `MEDIA_COLLECTION_ALL_TABS` → `src/constants/media/file-rules.ts`; `PERMISSION_NAME_TO_ID` → `src/lib/utils/permission.ts`; `countTaxonomyTreeNodes` → `src/lib/utils/taxonomy.ts`; barrels use `export type *`.

---

## Baseline run (2026-05-29)

### Full local gate

| Command | Result | Notes |
|---------|--------|-------|
| `npm run format:biome` | **Pass** | Biome format |
| `npm run lint:biome` | **Pass** | 1 **warning** (non-blocking): `src/components/ui/sidebar.tsx` `noDocumentCookie` — shadcn upstream |
| `npm run lint` | **Pass** | ESLint; `src/constants/**` data-only; `src/types/**` type-only |
| `npx tsc --noEmit` | **Pass** | Strict TypeScript |
| `npm run quality:deps` | **Pass** | Madge + jscpd (see below) |
| `npm run build` | **Pass** | `next build` (Next.js 16.2.1) |

Recommended before PR: run the table above (or at minimum `lint:biome`, `tsc`, `quality:deps`, `build`).

### `quality:deps` only

| Check | Result | Notes |
|-------|--------|-------|
| `npm run cycles` | **Pass** | 311 files processed; no circular dependency |
| `npm run dupl` | **Pass** | **215** files analyzed (UI primitives excluded); **0 clones** (0% duplicated lines) |

_Re-run after media library a11y fix (2026-05-27): same results — `lint:biome`, `lint`, `tsc --noEmit`, `quality:deps`, `build` all pass._

**jscpd dedup refactors (2026-05-27):**

| Was duplicated | Extracted to |
|----------------|--------------|
| `api/methods.ts` ↔ `api/raw-http.ts` header/cookie helpers | `src/api/axios-helpers.ts` |
| Login ↔ signup email/password fields | `src/components/common/auth-menu/auth/auth-form-fields.tsx` (`AuthEmailPasswordFields`, …) |
| `DashboardSidebarLevel` ↔ `DashboardSidebarSubLevel` | Single `DashboardSidebarTree` with `level: "root" \| "sub"` in `dashboard-sidebar.tsx` |

---

## CI / production quality gate

| Stage | Job | What runs |
|-------|-----|-----------|
| **CI (`dev` deploy)** | `test` | `npm ci`, `npm run quality:deps` (`cycles` + `dupl`), **`npm run lint`** |
| **CI (`dev` deploy)** | `build` | `npm ci`, `npm run build` (after `test` passes) |
| **CI (`dev` deploy)** | `deploy` | SSH → VPS `npm ci` + `npm run build` + PM2 reload (quality checks are **not** re-run on the server) |
| **Recommended local** | — | `lint:biome`, `lint`, `tsc --noEmit`, `quality:deps`, `build` (see **Full local gate** above) |

Do **not** use backend `make check-dupl` or `make check-architecture` in this frontend repo — use the npm scripts above instead.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [`dependencies.md`](./dependencies.md) | `madge`, `jscpd` devDependencies |
| [`folder-structure.md`](./folder-structure.md) | `.jscpd.json`, `.jscpd-report/` |
| [`architecture.md`](./architecture.md) | Stack row for dependency / clone tools |
