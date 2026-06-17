# Docker Compose & manual container deploy (frontend)

Alternative to PM2 + `npm run build` on the VPS in [`docs/deploy.md`](deploy.md). **CI/CD (`.github/workflows/*`) is unchanged.**

---

## Environment matrix

| Environment | Env file | Host port | Image tag |
|-------------|----------|-----------|-----------|
| local | `.env.local` | 3000 | `mycourse-fe:local` |
| dev | `.env.dev` | 3000 | `mycourse-fe:dev` |
| staging | `.env.staging` | 3001 | `mycourse-fe:staging` |
| prod | `.env.prod` | 3002 | `mycourse-fe:prod` |

Ports match `ecosystem.config.cjs` (dev uses default Next port 3000; staging **3001**; prod **3002**).

Copy templates:

```bash
cp .env.local.example .env.local
# or cp .env.dev.example .env.dev, etc.
```

---

## Quick start (local)

**Linux / macOS / WSL:**

```bash
cd fe-mycourse
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL (must match your API — local or cloud)

./scripts/docker/compose-up.sh local
./scripts/docker/health-check.sh local
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
./scripts/docker/compose-down.sh local
```

**Windows 10 / 11 (CMD hoặc PowerShell)** — Docker Desktop + WSL2 backend khuyến nghị:

```cmd
cd fe-mycourse
copy .env.local.example .env.local

scripts\docker\compose-up.cmd local
scripts\docker\health-check.cmd local
scripts\docker\compose-down.cmd local
```

PowerShell:

```powershell
.\scripts\docker\compose-up.ps1 local
.\scripts\docker\health-check.ps1 local
.\scripts\docker\compose-down.ps1 local
```

---

## Scripts (`scripts/docker/`)

| Script | Purpose |
|--------|---------|
| `compose-up` (`.sh` / `.ps1` / `.cmd`) | Load env for build-args → compose up |
| `compose-down` | Tear down |
| `build-image` | Build image only |
| `health-check` | HTTP poll (200/307/308) |
| `swarm-deploy` | Swarm demo — **not for CI/tests** |

- **Unix:** `_lib.sh` exports `NEXT_PUBLIC_*` for compose build-args
- **Windows 10/11:** `_lib.ps1` + `.cmd` wrappers; logic mirror `.sh`

---

## Dockerfile (aligned with CI)

- **Quality gates:** CI runs **`npm run test-all`** before build; locally run **`npm run check-all`** before shipping. The Docker image only runs the **production build** step (same as CI **`build`** / VPS deploy).
- **Deps:** `node:22-bookworm-slim`, `npm ci`
- **Build:** `npm run build` with build-args:
  - `NEXT_PUBLIC_API_URL` (required)
  - `NEXT_PUBLIC_STREAM_SSE_URL`, `NEXT_PUBLIC_STREAM_WS_URL`, `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` (optional)
- **Prune:** `npm prune --omit=dev` after build — drops devDependencies from `node_modules` before the runner stage (same as VPS deploy in [`docs/deploy.md`](deploy.md))
- **Run:** copy `.next`, `node_modules`, `public`, `package.json`; `npm run start`
- **No** `output: 'standalone'` — same constraint as [`docs/deploy.md`](deploy.md)

`AUTH_COOKIE_DOMAIN` is **runtime** only (Server Actions) — set in env file, not build-args.

---

## Rebuild after URL changes

`NEXT_PUBLIC_*` values are **baked into the client bundle** at `docker build`. After changing them:

```bash
./scripts/docker/compose-up.sh local   # --build recreates the image
```

Changing env in a running container **without rebuild** does not update the browser bundle.

---

## VPS manual deploy (example: dev)

```bash
git pull
cp .env.dev.example .env.dev
./scripts/docker/build-image.sh dev
docker compose -f docker/compose.dev.yml up -d
./scripts/docker/health-check.sh dev
```

---

## Swarm stack (demo only)

`docker/stack.*.yml` — 2 replicas, start-first update. Requires `docker swarm init` and `./scripts/docker/swarm-deploy.sh <env>`.

---

## Compose project names

`mycourse-fe-local`, `mycourse-fe-dev`, `mycourse-fe-staging`, `mycourse-fe-prod`

---

## Related docs

- [`docs/deploy.md`](deploy.md) — PM2 + GitHub Actions runbook
- [`docs/quality.md`](quality.md) — `test-all`, `check-all`, lint/build gates
- [`README.md`](../README.md) — getting started
