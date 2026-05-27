# Code quality tools (`fe-mycourse`)

_Last audited: 2026-05-27 (`minLines` 10 in `.jscpd.json`)._

Optional **local** checks for import cycles and duplicated source. They are **not** run in CI today (see [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml): `npm ci` + `npm run build` only).

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
| `dupl` | `jscpd src --config .jscpd.json` | Duplicate code detection |
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
| `ignore` | `.next`, `node_modules`, lockfiles, `*.d.ts`, … | See `.jscpd.json` |

**False positives:** shadcn/ui boilerplate or similar login/signup forms may appear as clones; tune `minLines` / `threshold` only after team review.

---

## Baseline run (2026-05-27)

| Check | Result | Notes |
|-------|--------|-------|
| `npm run cycles` | **Pass** | 307 files processed; no circular dependency |
| `npm run dupl` | **Pass** | 5 clones reported (~0.68% duplicated lines); under 80% threshold |

Known clones (informational, no action required unless refactoring):

- `login-content.tsx` ↔ `signup-content.tsx` (auth forms)
- `dashboard-sidebar.tsx` (internal repeated blocks)
- `api/methods.ts` ↔ `api/raw-http.ts` (shared HTTP helpers)

---

## CI / production quality gate

| Stage | What runs |
|-------|-----------|
| **CI (`dev` deploy)** | `npm ci`, `npm run build` |
| **Recommended local** | `npm run lint`, `npm run lint:biome`, `tsc --noEmit` (if used), `npm run build`, optionally `npm run cycles` / `npm run dupl` |

Do **not** document `make check-dupl` or `make check-architecture` for this frontend repo.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [`dependencies.md`](./dependencies.md) | `madge`, `jscpd` devDependencies |
| [`folder-structure.md`](./folder-structure.md) | `.jscpd.json`, `.jscpd-report/` |
| [`architecture.md`](./architecture.md) | Stack row for dependency / clone tools |
