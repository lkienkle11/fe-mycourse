# GitNexus research — Docker Compose (FE)

**Date:** 2026-06-14  
**Task:** Add Dockerfile + compose/stack + scripts (no TS/React symbol edits)

## Index

- Repo: `fe-mycourse`, query against deploy/build docs and `docs/quality.md`
- Embeddings: refresh at Phase 3 with `npx gitnexus analyze --force`

## Queries

| Query | Findings |
|-------|----------|
| `next build deploy npm start environment` | `docs/deploy.md`, `docs/quality.md`, `README.md`, `ecosystem.config.cjs` |

## Reuse

| Asset | Reuse for Docker |
|-------|------------------|
| Node | 22 LTS (CI + ecosystem) |
| Build | `npm ci` + `npm run build` |
| Start | `npm run start` → `next start -p $PORT` |
| Env | `NEXT_PUBLIC_API_URL` required at build time; `AUTH_COOKIE_DOMAIN` runtime |
| Ports | dev/local 3000, staging 3001, prod 3002 (`ecosystem.config.cjs`) |
| PM2 env files | `.env.local`, `.env.staging`, `.env.prod` pattern |

## Symbols changed

**None** — infra-only.

## Risk

| Area | Level | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_*` bake-in | MEDIUM | Compose must pass build-args; rebuild after URL change |
| No standalone output | LOW | Copy `.next` + `node_modules` per existing deploy doc |

## Docs gap

| Doc | Gap |
|-----|-----|
| `docs/deploy.md` | PM2/VPS only; no Docker compose |
| Env templates | Only `.env.example`; missing per-env `.env.*.example` set |
| README | No Docker section |

## Git baseline

- Branch: `chore/vietnamese-i18n-copy-polish` (ahead 1)
- No existing Docker files
- CI: `.github/workflows/deploy-dev.yml` — **do not edit**

## Phase 2 file list

- `Dockerfile`, `.dockerignore`, `.env.{local,dev,staging,prod}.example`
- `docker/compose.*.yml`, `docker/stack.*.yml`
- `scripts/docker/*`
