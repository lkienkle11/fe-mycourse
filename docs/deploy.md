# Deploying MyCourse Frontend on Ubuntu 24.04

This guide is the **frontend** counterpart to **[`be/docs/deploy.md`](../../be/docs/deploy.md)** (backend + full-stack VPS). It uses the **same layout and runbook style**: ordered steps, Nginx + TLS + PM2, and CI/CD appendix material—**scoped to the Next.js app** in the **`fe`** tree.

**Full stack on one VPS:** Follow the backend runbook first (DNS, Nginx split, Certbot, PM2 for API + web, `CORS_ALLOWED_ORIGINS`, etc.). Use this document for **frontend-only** env vars, `next build` / `next start`, and the **web** go-live checklist.

**Replace `yourdomain.net`** with your real domain. Paths assume a monorepo checkout with **`fe/`** at e.g. `/opt/mycourse/fe`; adjust if the frontend is a standalone repo.

---

## Deployment runbook (do these in order)

### Step 1 — Prerequisites

1. **Server:** Ubuntu 24.04 LTS (or the same host as in `be/docs/deploy.md`) with sudo.
2. **DNS:** Apex / `www` hostnames point to this server **before** TLS (same as backend guide).
3. **API URL:** Know the **public** base URL of the Go API (e.g. `https://api.yourdomain.net`). The browser and server actions will call this origin; it must match **HTTPS** in production and **`CORS_ALLOWED_ORIGINS`** on the backend.
4. **Node.js:** Install a version that satisfies Next.js **16** and React **19** (the backend guide suggests **Node 22 LTS**—use the same on a shared VPS).

---

### Step 2 — Update the system and install core packages

If you **already** completed Step 2 in `be/docs/deploy.md`, skip duplicates and ensure these are present:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  ca-certificates curl wget git vim htop tmux unzip \
  ufw fail2ban \
  nginx certbot python3-certbot-nginx \
  software-properties-common apt-transport-https \
  jq rsync openssh-server
```

| Package | Purpose |
|---------|---------|
| `nginx`, `certbot`, `python3-certbot-nginx` | Reverse proxy + Let’s Encrypt (same pattern as backend guide) |
| `ufw`, `fail2ban` | Firewall and SSH hardening |
| `git`, `rsync` | Code sync; CI deploy over SSH |

You **do not** need Go or PostgreSQL client **on this machine** for frontend-only work unless you also run the API here.

---

### Step 3 — Install Node.js (match CI / backend guide)

**Option A — NodeSource (example: Node 22 LTS):**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

**Option B — nvm:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# new shell
nvm install 22 && nvm use 22
```

---

### Step 4 — Install PM2 and enable startup

```bash
sudo npm install -g pm2
pm2 startup systemd -u "$USER" --hp "$HOME"
# Run once the `sudo env PATH=...` command PM2 prints
```

Use PM2 to run **`npm run start`** (production Next.js server), typically on **port 3000**, behind Nginx—same integration as **`mycourse-web`** in `be/docs/deploy.md` Step 16.

---

### Step 5 — Configure the firewall

If not already done (`be/docs/deploy.md` Step 7):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

---

### Step 6 — Deploy path and application code

Example layout (consistent with backend):

```text
/opt/mycourse/fe
```

Clone or `rsync` the repository so **`fe/package.json`** and **`fe/package-lock.json`** exist. Production workflow is usually:

- **On server:** `git pull` (or CI `rsync`) → `npm ci` → `npm run build` → `pm2 reload mycourse-web`.

Building on the server avoids shipping a partial `.next` without matching `node_modules` (this project does **not** enable `output: 'standalone'` in `next.config.ts`).

---

### Step 7 — Environment variables (build time + runtime)

Create **non-committed** env files at **`fe/`** root (e.g. `.env.production.local` or a single `.env` used only on the server).

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Public base URL of the API **without** a trailing slash, e.g. `https://api.yourdomain.net`. |

**Critical:** `NEXT_PUBLIC_*` variables are inlined at **`next build`**. Changing them **after** build without rebuilding can leave stale API URLs in the client bundle. Set them **before** `npm run build` in each environment.

The Axios instance reads `NEXT_PUBLIC_API_URL` as `baseURL` in `src/api/instance.ts`. Login/signup use Server Actions; cookies and CORS must still align with the API (see root **`README.md`** and backend deploy doc).

---

### Step 8 — Install dependencies and production build

```bash
cd /opt/mycourse/fe
npm ci
# Ensure NEXT_PUBLIC_API_URL is set in the environment or in .env.production.local
npm run build
```

Smoke-test locally on the server (optional):

```bash
NODE_ENV=production PORT=3000 npm run start
# curl -I http://127.0.0.1:3000
```

---

### Step 9 — Nginx: reverse proxy to Next.js (HTTP first)

Use the **same** `mycourse-web` vhost as in **`be/docs/deploy.md` Step 13** — frontend hostnames → **`127.0.0.1:3000`**.

```nginx
server {
    listen 80;
    server_name yourdomain.net www.yourdomain.net;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
    }
}
```

Enable the site and reload (`be/docs/deploy.md` Step 13, enable + `nginx -t`).

---

### Step 10 — TLS with Certbot

Request certificates together with the API hostname so one cert covers apex, `www`, and `api` (see **`be/docs/deploy.md` Step 14**):

```bash
sudo certbot --nginx \
  -d yourdomain.net \
  -d www.yourdomain.net \
  -d api.yourdomain.net
```

After HTTPS is active, **`NEXT_PUBLIC_API_URL`** should use **`https://api.yourdomain.net`** and the site should be served over **`https://`** for `yourdomain.net` / `www`.

---

### Step 11 — Run Next.js under PM2

Add or merge the **`mycourse-web`** app into the same `ecosystem.config.cjs` as the backend (`be/docs/deploy.md` Step 16). Example:

```javascript
{
  name: 'mycourse-web',
  cwd: '/opt/mycourse/fe',
  script: 'npm',
  args: 'run start',
  instances: 1,
  autorestart: true,
  env: {
    NODE_ENV: 'production',
    PORT: 3000,
    NEXT_PUBLIC_API_URL: 'https://api.yourdomain.net',
  },
},
```

**Important:** If you rely on a **file** for `NEXT_PUBLIC_*`, run **`npm run build`** with that file present, then keep the same values in PM2 `env` for consistency. If PM2 cannot load `.env` files, use **`env`** / **`env_production`** or systemd `EnvironmentFile=`.

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

---

### Step 12 — Verify end-to-end

1. Open **`https://yourdomain.net`** (or `www`) — Next.js should load through Nginx.
2. Confirm locale routing: with **`next-intl`** and `localePrefix: "always"`, expect paths like **`/vi`** or **`/en`** (see `src/i18n/routing.ts`).
3. Exercise **login** and **GET /api/v1/me** from the UI; confirm `CORS` and cookies work against **`https://api.yourdomain.net`**.

Optional:

```bash
curl -sS -o /dev/null -w "%{http_code}" https://yourdomain.net/vi
```

---

### Step 13 — Go-live checklist (frontend)

- [ ] `NEXT_PUBLIC_API_URL` is the **HTTPS** API URL used at **build** time for this release.
- [ ] Backend **`CORS_ALLOWED_ORIGINS`** includes `https://yourdomain.net` and `https://www.yourdomain.net` (no trailing slashes).
- [ ] Nginx proxies **`/`** to **`127.0.0.1:3000`** with `X-Forwarded-Proto` so Next sees HTTPS where relevant.
- [ ] PM2 **`mycourse-web`** restarts on reboot (`pm2 startup` + `pm2 save`).
- [ ] TLS covers all public hostnames you use.
- [ ] Auth: login, refresh (`X-Token-Expired`), logged-out `/me`, and i18n (`src/messages/*.json`) verified.
- [ ] **Locale middleware:** Next.js only loads middleware from a file named **`middleware.ts`** at the project root or under **`src/`**. The project currently ships **`src/proxy.ts`** with `next-intl` middleware—**rename or re-export** so Next actually runs it (see Appendix C).

---

## Appendix A — Target architecture (frontend)

```text
Browser → DNS → Nginx (TLS, server_name apex + www) → 127.0.0.1:3000 (next start via PM2)
                ↘ separate server block → 127.0.0.1:8080 (Go API)  [see be/docs/deploy.md]
```

---

## Appendix B — Behaviour tied to the backend

| Topic | Where to read |
|--------|----------------|
| Server Actions + cookies for login/signup | Root **`README.md`** |
| Axios, refresh, `ApiResult`, error store | **`README.md`**, `src/api/instance.ts` |
| API paths | `src/constants/api-route.ts` |
| Full-stack VPS, API env, DB, Redis | **`be/docs/deploy.md`** |

---

## Appendix C — Internationalization middleware

`src/proxy.ts` defines **`createMiddleware`** from `next-intl` and an export **`config.matcher`**. Next.js expects **`middleware.ts`** (or `src/middleware.ts`). Until the file is renamed or bridged, locale-prefix redirects may not run in production—verify **`/vi`** and **`/en`** behaviour after deploy.

---

## Appendix D — CI/CD (GitHub Actions, frontend)

Align with **`be/docs/deploy.md` Appendix C**. Typical split:

| Job | Responsibility |
|-----|----------------|
| `lint-frontend` | `npm ci` in `fe`, `npm run lint` / `lint:biome` |
| `build-frontend` | `npm ci` + `npm run build` with `NEXT_PUBLIC_API_URL` from GitHub **Secrets** / **Variables** for the target environment |
| `deploy-frontend` | SSH + `git pull` or `rsync`, then on server: `npm ci`, `npm run build`, `pm2 reload mycourse-web` |

Store **`NEXT_PUBLIC_API_URL`** per environment (preview vs production). **Rebuild** when it changes.

Example build step (monorepo):

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: "npm"
    cache-dependency-path: fe/package-lock.json
- name: Install and build
  working-directory: fe
  env:
    NEXT_PUBLIC_API_URL: ${{ vars.PUBLIC_API_URL }}
  run: |
    npm ci
    npm run build
```

Deploy can upload **source** and run **`npm ci && npm run build`** on the VPS so the **server** is the single place that bakes `NEXT_PUBLIC_*` for production—or build in CI and rsync **`fe/`** including `.next` **and** `node_modules` (heavier). Prefer **build on server** unless you add **`output: 'standalone'`** later.

---

## Appendix E — Key files in repo `fe`

| Area | Path |
|------|------|
| Next config + i18n plugin | `next.config.ts` |
| Entry layouts | `src/app/layout.tsx`, `src/app/[locale]/layout.tsx` |
| Routes / home | `src/app/[locale]/(web)/`, `src/screen/` |
| API client | `src/api/instance.ts`, `src/api/methods.ts` |
| Auth actions | `src/actions/auth/auth.ts` |
| i18n | `src/i18n/routing.ts`, `src/i18n/request.ts` |
| Docs | `docs/architecture.md`, `docs/flow.md`, `docs/screens.md`, **this file** |

---

## Appendix F — GitNexus index

After large merges, refresh the **`fe`** graph (see **`AGENTS.md`**):

```bash
cd /opt/mycourse/fe   # or your checkout
npx gitnexus analyze
# If embeddings were used: npx gitnexus analyze --embeddings
```

---

*Adjust domains, paths, and secrets to match your environment. For API + DB + Redis + joint Nginx, always keep **`be/docs/deploy.md`** as the source of truth for the full stack.*
