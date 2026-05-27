# Code quality tools (`fe-mycourse`)

_Last audited: 2026-05-27 (jscpd ignores `src/components/ui/**`; CI `test` job: `quality:deps`)._

Checks for **circular imports** (Madge) and **duplicate code** (jscpd) under `src/`. jscpd **skips** [`src/components/ui/`](../src/components/ui/) (shadcn upstream primitives — shared design system, not feature duplication). On push to **`dev`**, CI runs them via `npm run quality:deps` in the **`test`** job **before** `npm run build` (see [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml)).

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
| `cycles` | `madge --circular … src` | Detect circular **static** import chains under `src/` |
| `cycles:json` | Same + `--json` | JSON output for tooling |
| `dupl` | `jscpd src --config .jscpd.json` | Duplicate code detection (excludes paths in `ignore`; see below) |
| `quality:deps` | `npm run cycles && npm run dupl` | Run both gates in sequence |

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

**Informational clones (still scanned):** login vs signup forms, internal blocks in `dashboard-sidebar.tsx`, shared helpers in `api/methods.ts` ↔ `api/raw-http.ts`. Tune `minLines` / `threshold` only after team review — do **not** lower threshold to hide real duplication in `src/components/common/` or `src/api/`.

---

## Baseline run (2026-05-27)

| Check | Result | Notes |
|-------|--------|-------|
| `npm run cycles` | **Pass** | 307 files processed; no circular dependency |
| `npm run dupl` | **Pass** | **209** files analyzed (UI primitives excluded); 5 clones (~**1.17%** duplicated lines); under 80% threshold |

Known clones (informational, no action required unless refactoring):

- `login-content.tsx` ↔ `signup-content.tsx` (auth forms)
- `dashboard-sidebar.tsx` (internal repeated blocks)
- `api/methods.ts` ↔ `api/raw-http.ts` (shared HTTP helpers)

---

## CI / production quality gate

| Stage | Job | What runs |
|-------|-----|-----------|
| **CI (`dev` deploy)** | `test` | `npm ci`, `npm run quality:deps` (`cycles` + `dupl`) |
| **CI (`dev` deploy)** | `build` | `npm ci`, `npm run build` (after `test` passes) |
| **CI (`dev` deploy)** | `deploy` | SSH → VPS `npm ci` + `npm run build` + PM2 reload (quality checks are **not** re-run on the server) |
| **Recommended local** | — | `npm run lint`, `npm run lint:biome`, `npm run build`; use `npm run quality:deps` before large refactors |

Do **not** use backend `make check-dupl` or `make check-architecture` in this frontend repo — use the npm scripts above instead.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [`dependencies.md`](./dependencies.md) | `madge`, `jscpd` devDependencies |
| [`folder-structure.md`](./folder-structure.md) | `.jscpd.json`, `.jscpd-report/` |
| [`architecture.md`](./architecture.md) | Stack row for dependency / clone tools |
