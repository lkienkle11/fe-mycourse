# Deploying MyCourse Frontend on Ubuntu 24.04

This is the **frontend** deployment runbook for the MyCourse Next.js application. It uses the same style and naming conventions as **[`be/docs/deploy.md`](../../be/docs/deploy.md)** — follow that guide first for DNS, Postgres, Redis, and the Go API service.

**Scope of this document:** Next.js-specific steps — environment variables, `next build` / `next start`, Nginx vhost for the web app, PM2 config, and the frontend go-live checklist.

**Replace `yourdomain.net`** with your real domain throughout. Paths below use **`/opt/mycourse/fe`** as a monorepo example; the checked-in **`ecosystem.config.cjs`** uses **`/var/www/fe-mycourse`** (dev), **`/var/www/fe-mycourse-staging`**, and **`/var/www/fe-mycourse-prod`** as `cwd` values — substitute your actual checkout path in every command.

---

## Quick Reference

| Item | Value |
|------|-------|
| App port | `3000` (Next.js production server; staging/prod ports differ in repo `ecosystem.config.cjs`) |
| PM2 process name | **Manual runbook:** `mycourse-web` · **Repo CI (`dev`):** `mycourse-web-dev` (see `ecosystem.config.cjs`) |
| Deploy path | **Example:** `/opt/mycourse/fe` · **CI secret:** `DEPLOY_PATH_DEV` → server directory checked out for `dev` (often `/var/www/fe-mycourse` in `ecosystem.config.cjs`) |
| Nginx vhost | `yourdomain.net` / `www.yourdomain.net` → `127.0.0.1:3000` |
| Required env var | `NEXT_PUBLIC_API_URL` (must be set **before** `npm run build`) |
| Optional env var | `AUTH_COOKIE_DOMAIN` (needed when FE and API are on different subdomains) |
| Node.js version | 22 LTS (match `be/docs/deploy.md`) |
| GitHub Actions | Push to **`dev`** → `.github/workflows/deploy-dev.yml` (build in CI + deploy rebuild on VPS — [Appendix G](#appendix-g--cicd-github-actions)) |

> **PM2 process names:** This runbook uses **`mycourse-web`** in examples for a single manual app. The repo’s **`ecosystem.config.cjs`** and **GitHub Actions** use **`mycourse-web-dev`** (and staging/prod siblings). Use the name that matches `pm2 list` on your server (e.g. `pm2 logs mycourse-web-dev`).

---

## Deployment Runbook

Run steps **in order**. Each step notes whether it can be skipped if you already completed the backend guide on the same host.

---

### Step 1 — Prerequisites

1. **Server:** Ubuntu 24.04 LTS with `sudo` access (same host as the backend, or a dedicated web server).
2. **DNS:** `yourdomain.net` and `www.yourdomain.net` must resolve to this server's IP **before** requesting TLS certificates.
3. **API URL:** Obtain the public HTTPS base URL of the Go API (e.g. `https://api.yourdomain.net`). This is the value for `NEXT_PUBLIC_API_URL`.
4. **Backend CORS:** Ensure `CORS_ALLOWED_ORIGINS` in the backend includes `https://yourdomain.net` and `https://www.yourdomain.net` (no trailing slashes).
5. **Middleware filename:** The project ships `src/proxy.ts` with the `next-intl` middleware. **Rename it before deploying:**
   ```bash
   mv /opt/mycourse/fe/src/proxy.ts /opt/mycourse/fe/src/middleware.ts
   ```
   Next.js only loads middleware from `src/middleware.ts` (or `middleware.ts` at project root). Without this rename, locale-prefix redirects (`/vi`, `/en`) will **not** work in production.

---

### Step 2 — System update and core packages

Skip if already done in `be/docs/deploy.md` Step 2. Verify at minimum these packages are present:

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
| `nginx` + `certbot` + `python3-certbot-nginx` | Reverse proxy + Let's Encrypt TLS |
| `ufw` + `fail2ban` | Firewall and SSH brute-force protection |
| `git` + `rsync` | Code sync; CI/CD deploy over SSH |

You do **not** need Go or PostgreSQL client here if the frontend is on a dedicated server.

---

### Step 3 — Install Node.js 22 LTS

**Option A — NodeSource (recommended for VPS):**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v22.x.x
npm -v
```

**Option B — nvm (easier for multi-version management):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # or open a new shell
nvm install 22
nvm use 22
nvm alias default 22
```

---

### Step 4 — Install PM2 and enable startup

```bash
sudo npm install -g pm2
pm2 startup systemd -u "$USER" --hp "$HOME"
# Copy and run the sudo command PM2 prints — it registers a systemd unit.
```

PM2 will run `npm run start` (which calls `next start -p 3000`) and restart it automatically on crash or server reboot.

---

### Step 5 — Configure the firewall

Skip if done in `be/docs/deploy.md` Step 7. Confirm the rules are active:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # opens ports 80 and 443
sudo ufw enable
sudo ufw status verbose
```

> **Important:** Allow `OpenSSH` **before** enabling UFW to avoid locking yourself out.

---

### Step 6 — Deploy application code

Create the deploy directory and check out the repository:

```bash
sudo mkdir -p /opt/mycourse
sudo chown "$USER":"$USER" /opt/mycourse
cd /opt/mycourse
git clone https://github.com/your-org/mycourse.git .
# Or for a monorepo structure:
# git clone ... && cd mycourse
```

Confirm the frontend source is at `/opt/mycourse/fe/package.json`.

**Subsequent deploys:** `git pull` or `rsync` from CI, then rebuild (see [Step 8](#step-8--install-dependencies-and-build)).

---

### Step 7 — Environment variables

Create a **non-committed** env file at the `fe/` root. This file is read by `next build` and `next start`:

```bash
nano /opt/mycourse/fe/.env.production.local
```

#### Required variables

```ini
# Public base URL of the Go API — used by the browser AND by Server Actions.
# Must be HTTPS in production. Set this BEFORE running npm run build.
NEXT_PUBLIC_API_URL=https://api.yourdomain.net
```

#### Optional but important in production

```ini
# Parent domain for auth cookies when FE and API are on different subdomains.
# Example: FE on yourdomain.net, API on api.yourdomain.net
#   → set AUTH_COOKIE_DOMAIN=yourdomain.net
# Localhost: leave unset (getCookieDomain returns undefined, no domain attribute is set).
AUTH_COOKIE_DOMAIN=yourdomain.net

# Server-side-only fallback for NEXT_PUBLIC_API_URL (not inlined into client bundle).
# Useful if you want the Node.js server to use an internal address while the browser
# uses the public HTTPS URL. Usually set to the same value as NEXT_PUBLIC_API_URL.
API_URL=https://api.yourdomain.net
```

#### Variable reference table

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Build + client + server | Base URL for all API calls. `NEXT_PUBLIC_*` variables are **inlined at `next build`** — you **must** rebuild after changing this. |
| `AUTH_COOKIE_DOMAIN` | Prod recommended | Server only | Parent domain for `access_token`, `refresh_token`, `session_id` cookies. Passed to `getCookieDomain()` → included in `buildCookieOptions()` via `loginAction`. Without this on a multi-subdomain setup, cookies may not be sent to the API. |
| `API_URL` | No | Server only | Server-side fallback API URL. Not exposed to the client bundle. Useful for private/internal network routing. |

> **`NEXT_PUBLIC_*` warning:** These values are **baked into the JS bundle** at build time. If you change `NEXT_PUBLIC_API_URL` without rebuilding, old client code will still call the previous URL. Always rebuild after changing any `NEXT_PUBLIC_*` variable.

---

### Step 8 — Install dependencies and build

```bash
cd /opt/mycourse/fe

# Ensure .env.production.local is in place with correct NEXT_PUBLIC_API_URL

# Install exact versions from lockfile (reproducible)
npm ci

# Production build — NEXT_PUBLIC_* variables are read from env/file here
npm run build
```

Smoke-test the build locally on the server (optional):

```bash
NODE_ENV=production PORT=3000 npm run start &
sleep 3
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000
# Expected: HTTP 307 (locale redirect to /vi) or HTTP 200
kill %1
```

> **Note:** The project does **not** enable `output: 'standalone'` in `next.config.ts`. Build on the server so `.next` and `node_modules` are always in sync.

---

### Step 9 — Nginx: reverse proxy (HTTP first)

Create the vhost file:

```bash
sudo nano /etc/nginx/sites-available/mycourse-web
```

Paste the following:

```nginx
server {
    listen 80;
    server_name yourdomain.net www.yourdomain.net;

    # Security headers (HTTPS equivalents added automatically by Certbot)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Next.js static assets — long cache, content-addressed filenames
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_set_header Host $host;
    }

    # Everything else → Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 90s;
        proxy_buffering off;    # Required for Next.js streaming / SSE
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/mycourse-web \
           /etc/nginx/sites-enabled/mycourse-web
sudo nginx -t
sudo systemctl reload nginx
```

Verify HTTP is reachable:

```bash
curl -I http://yourdomain.net
# Expected: 200 or 307 (locale redirect), served by nginx
```

---

### Step 10 — TLS with Certbot

Request certificates covering all public hostnames at once. If the API vhost is on the same server, include its hostname here too (only one cert needed):

```bash
sudo certbot --nginx \
  -d yourdomain.net \
  -d www.yourdomain.net \
  -d api.yourdomain.net   # include only if API is on same server
```

Certbot automatically:
- Obtains and installs the Let's Encrypt certificate.
- Modifies your Nginx vhosts to listen on 443 with TLS.
- Sets up an HTTP → HTTPS redirect on port 80.
- Configures a cron/systemd timer for automatic renewal.

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

After TLS is active, update `NEXT_PUBLIC_API_URL` to use `https://api.yourdomain.net` if you haven't already, and rebuild.

---

### Step 11 — Run Next.js under PM2

The repository includes **`ecosystem.config.cjs`** at the frontend root with three apps (`mycourse-web-dev`, `mycourse-web-staging`, `mycourse-web-prod`) and per-environment `cwd` / `env_file`. CI for **`dev`** reloads **`mycourse-web-dev`** only. The snippet below is a minimal single-app example; align names and paths with that file if you use the shipped config.

Create or update the PM2 ecosystem file. If you already have one from the backend guide at `/opt/mycourse/ecosystem.config.cjs`, add the `mycourse-web` entry:

```javascript
// /opt/mycourse/ecosystem.config.cjs
module.exports = {
  apps: [
    // --- Go API (from be/docs/deploy.md) ---
    {
      name: 'mycourse-api',
      cwd: '/opt/mycourse/be',
      script: './mycourse-api',   // compiled Go binary
      instances: 1,
      autorestart: true,
      env: { /* ... API env vars ... */ },
    },

    // --- Next.js frontend ---
    {
      name: 'mycourse-web',
      cwd: '/opt/mycourse/fe',
      script: 'npm',
      args: 'run start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Runtime env vars for Server Actions and token refresh
        NEXT_PUBLIC_API_URL: 'https://api.yourdomain.net',
        AUTH_COOKIE_DOMAIN: 'yourdomain.net',
        API_URL: 'https://api.yourdomain.net',
      },
    },
  ],
};
```

> **Note on `NEXT_PUBLIC_*` in PM2:** `NEXT_PUBLIC_API_URL` is baked into the bundle during `npm run build`. Setting it in PM2 `env` provides it for server-side reads at runtime but does **not** change the client bundle. Always ensure the same value is present when building.

Start PM2 and persist the process list:

```bash
cd /opt/mycourse
pm2 start ecosystem.config.cjs
pm2 save
```

Check the web process is running:

```bash
pm2 list
pm2 logs mycourse-web --lines 50
```

---

### Step 12 — Verify end-to-end

```bash
# HTTPS loads with locale redirect
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://yourdomain.net
# Expected: 307 https://yourdomain.net/vi   (or 200 if middleware redirect happens in Next.js)

# Vietnamese home page
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi

# English home page
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/en
```

**Manual checks:**
1. Open `https://yourdomain.net` in a browser — should redirect to `/vi` and render the home page.
2. Click the locale switcher — should navigate to `/en` (or vice versa).
3. Open the login modal, enter credentials — should set cookies and show `UserMenu` (avatar).
4. Hard-refresh — `UserMenu` should still be visible (SWR refetches `GET /api/v1/me`).
5. Open DevTools → Application → Cookies — verify `access_token`, `refresh_token`, `session_id` are present with `SameSite=Lax`, `Domain=.yourdomain.net`, and are **not** `HttpOnly`.

---

### Step 13 — Go-live checklist

```
Frontend
  [ ] NEXT_PUBLIC_API_URL is the HTTPS API URL used at build time for this release.
  [ ] AUTH_COOKIE_DOMAIN is set to the parent domain (e.g. yourdomain.net).
  [ ] src/proxy.ts has been renamed to src/middleware.ts — locale routing is enforced.
  [ ] npm run build completed without errors.
  [ ] PM2 mycourse-web is running and autorestart is enabled.
  [ ] pm2 save was run; PM2 startup unit was installed (pm2 startup systemd).

Nginx + TLS
  [ ] Nginx vhost for apex + www proxies to 127.0.0.1:3000 with X-Forwarded-Proto.
  [ ] TLS certificate covers all public hostnames (certbot --dry-run passes).
  [ ] HTTP → HTTPS redirect is active (curl -I http://yourdomain.net shows 301).
  [ ] Security headers (X-Frame-Options, X-Content-Type-Options) are present.

Integration
  [ ] Backend CORS_ALLOWED_ORIGINS includes https://yourdomain.net and https://www.yourdomain.net.
  [ ] Login flow sets cookies visible in browser DevTools.
  [ ] Token refresh works (auth stays valid after 15 min without re-login).
  [ ] GET /api/v1/me returns the authenticated user after login.
  [ ] Locale switcher navigates between /vi and /en correctly.
```

---

## Appendix A — Target Architecture

```
                           ┌─────────────────────────────────────────┐
Browser  ──────────────►  │  Nginx (TLS: yourdomain.net + www)       │
                           │  port 443 / 80                           │
                           │  ┌─────────────────────────────────────┐ │
                           │  │  Location /  →  127.0.0.1:3000      │ │
                           │  │  (next start — PM2: mycourse-web)    │ │
                           │  │                                     │ │
                           │  │  Server Actions → API_URL / NEXT_    │ │
                           │  │  PUBLIC_API_URL                     │ │
                           │  └────────────────────┬────────────────┘ │
                           └───────────────────────┼─────────────────┘
                                                   │
                           ┌───────────────────────▼─────────────────┐
                           │  Nginx (TLS: api.yourdomain.net)        │
                           │  port 443                               │
                           │  Location /  →  127.0.0.1:8080         │
                           │  (Go API — PM2: mycourse-api)           │
                           └─────────────────────────────────────────┘
```

---

## Appendix B — Environment Variables Reference

| Variable | Required | Build-time | Runtime | Description |
|----------|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | ✅ baked into bundle | ✅ also read server-side | Public Go API base URL. No trailing slash. Must match `CORS_ALLOWED_ORIGINS` on the backend. |
| `AUTH_COOKIE_DOMAIN` | Prod recommended | ❌ | ✅ Server Actions only | Parent domain for auth cookies. Without this, cookies set on `yourdomain.net` may not be sent to `api.yourdomain.net`. |
| `API_URL` | No | ❌ | ✅ Server only | Server-side fallback for API base URL. Not exposed to browser. Useful for private network routing. |

---

## Appendix C — Middleware (Locale Routing) Fix

`src/proxy.ts` contains a valid `next-intl` middleware:

```ts
// src/proxy.ts  (current, incorrect filename)
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
```

**Problem:** Next.js only executes middleware from `src/middleware.ts` or `middleware.ts` at the project root. The filename `proxy.ts` is not recognized.

**Fix (Option 1 — rename):**

```bash
git mv src/proxy.ts src/middleware.ts
git commit -m "fix: rename proxy.ts → middleware.ts so Next.js runs locale middleware"
```

**Fix (Option 2 — re-export bridge, keeps proxy.ts intact):**

```ts
// src/middleware.ts
export { default, config } from "./proxy";
```

After either fix, verify with:

```bash
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:3000/
# Expected: 307  http://127.0.0.1:3000/vi
```

---

## Appendix D — Full Deployment Update Procedure (Zero-Downtime)

Use this procedure for each new release:

```bash
cd /opt/mycourse

# 1. Pull latest code
git pull origin main

# 2. (Optional) Install new dependencies
cd fe && npm ci

# 3. Re-build (NEXT_PUBLIC_* must be present in env or .env.production.local)
npm run build

# 4. Reload PM2 with zero downtime (graceful reload, not restart)
pm2 reload mycourse-web

# 5. Confirm the new process is healthy
pm2 list
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi
```

> `pm2 reload` sends a SIGINT, waits for the process to exit cleanly, then starts the new instance. The old instance keeps serving requests during startup of the new one.

---

## Appendix E — Rollback Procedure

If the new release is broken, roll back immediately:

```bash
cd /opt/mycourse

# 1. Revert code to the previous working commit
git log --oneline -5   # identify the last good commit hash
git checkout <good-commit-hash> -- fe/

# 2. Re-install (if package-lock.json changed)
cd fe && npm ci

# 3. Rebuild from the previous state
npm run build

# 4. Reload PM2
pm2 reload mycourse-web

# 5. Verify
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi
```

Alternatively, keep the previous `.next/` build in a versioned directory and swap symlinks:

```bash
# Recommended pattern for fast rollbacks:
/opt/mycourse/fe/releases/
    v1.2.0/    ← current
    v1.1.9/    ← previous (keep 2-3 releases)
/opt/mycourse/fe/current  → ./releases/v1.2.0  (symlink)
```

Update the PM2 `cwd` to point to `/opt/mycourse/fe/current`.

---

## Appendix F — Log Management

**PM2 logs:**

```bash
pm2 logs mycourse-web          # tail live
pm2 logs mycourse-web --lines 200   # last 200 lines
pm2 flush                      # clear all PM2 log files
```

PM2 log files are at `~/.pm2/logs/mycourse-web-out.log` and `mycourse-web-error.log`.

**Rotate PM2 logs automatically:**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

**Nginx logs:**

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Appendix G — CI/CD (GitHub Actions)

File: **`.github/workflows/deploy-dev.yml`**. Trigger: **push to `dev`**. Concurrency: `fe-deploy-${{ github.ref }}` with **`cancel-in-progress: true`**.

This workflow differs from the backend: there is **no artifact rsync** — the **`deploy`** job SSHs into the VPS, syncs git, does a **clean `node_modules`**, runs **`npm ci` + `npm run build` on the server**, then **`pm2 reload mycourse-web-dev`** (or starts `ecosystem.config.cjs --only mycourse-web-dev`). The **`build`** job runs first as a **gate** (`npm ci` + `npm run build` on the runner) so a broken mainline fails before SSH; production bundles used on the VPS come from the **server** build (ensure `NEXT_PUBLIC_API_URL` and related vars exist in the server env file referenced by PM2, e.g. `env_file` in `ecosystem.config.cjs`).

### Required GitHub Secrets (frontend)

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Deploy key (same VPS as BE if shared) |
| `SSH_HOST` | Server IP or hostname |
| `SSH_USER` | SSH user |
| `DEPLOY_PATH_DEV` | Absolute path to the **frontend** git checkout on the server (must match `cwd` for `mycourse-web-dev` in `ecosystem.config.cjs`) |

### Job structure

| Job | Responsibility |
|-----|----------------|
| `build` | Checkout repo root, Node 22 (`cache: npm`), `npm ci` + `npm run build` — fails the workflow if the app does not build |
| `deploy` | SSH → `cd $DEPLOY_PATH_DEV` → `git stash -u`, `git checkout dev`, `git pull`, **`rm -rf node_modules`**, `npm ci`, `npm run build`, PM2 reload/start **`mycourse-web-dev`** |

### Workflow (matches repo)

```yaml
name: Deploy Frontend to VPS (dev)

on:
  push:
    branches:
      - dev

concurrency:
  group: fe-deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies and build
        run: |
          npm ci
          npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Setup SSH Agent
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add Server to known_hosts
        run: ssh-keyscan -H "${{ secrets.SSH_HOST }}" >> ~/.ssh/known_hosts

      - name: Pull, build, and reload PM2 on server
        run: |
          ssh "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" "cd ${{ secrets.DEPLOY_PATH_DEV }} && \
            git stash -u && \
            git checkout dev && \
            git pull && \
            rm -rf node_modules && \
            npm ci && \
            npm run build && \
            (pm2 reload mycourse-web-dev || pm2 start ecosystem.config.cjs --only mycourse-web-dev)"
```

### Notes

- **`DEPLOY_PATH_DEV`** — same naming convention as the backend workflow secret (`be/.github/workflows/deploy-dev.yml`); values differ per service (BE vs FE paths).
- **Clean `node_modules` on deploy** — guarantees lockfile-aligned installs after each pull (matches the workflow as of 2026).
- **`NEXT_PUBLIC_*` on the server** — must be present when **`npm run build`** runs on the VPS (e.g. `.env.production.local`, `.env.local`, or env injected before build). Changing them without rebuilding leaves a stale client bundle.
- **`AUTH_COOKIE_DOMAIN`** — runtime / server-side for cookies; keep on the server, not required in GitHub Actions for this workflow.
- **Backend CI** — still **2 jobs**, **`master`**, **`rsync`** binary to `DEPLOY_PATH_DEV/bin/` — see `be/docs/deploy.md` Appendix C.

---

## Appendix H — Troubleshooting

### Next.js app is not reachable

```bash
pm2 list                     # is mycourse-web running?
pm2 logs mycourse-web        # any startup errors?
curl http://127.0.0.1:3000   # bypass Nginx — is Next.js up?
sudo nginx -t                # Nginx config syntax OK?
sudo systemctl status nginx  # Nginx service running?
```

### 502 Bad Gateway from Nginx

Usually means the Next.js process is down or not listening on port 3000.

```bash
pm2 list                     # check status
pm2 restart mycourse-web     # force restart
ss -tlnp | grep 3000         # is port 3000 bound?
```

### Locale redirects not working (`/vi`, `/en` not enforced)

The middleware file is not registered. See [Appendix C](#appendix-c--middleware-locale-routing-fix).

```bash
ls /opt/mycourse/fe/src/middleware.ts   # must exist
# If missing:
mv /opt/mycourse/fe/src/proxy.ts /opt/mycourse/fe/src/middleware.ts
npm run build && pm2 reload mycourse-web
```

### Login works but cookies are not sent to the API

Check `AUTH_COOKIE_DOMAIN`. If FE is at `yourdomain.net` and API is at `api.yourdomain.net`, the parent domain must be set so the cookie is scoped to `.yourdomain.net`:

```bash
# In .env.production.local or PM2 env:
AUTH_COOKIE_DOMAIN=yourdomain.net
# Then rebuild + reload
npm run build && pm2 reload mycourse-web
```

### Auth tokens expire and the app does not recover

The token refresh interceptor (`doTokenRefresh` in `src/api/instance.ts`) requires the `refresh_token` and `session_id` cookies. Verify they are present in the browser after login. Also ensure the backend's `/api/v1/auth/refresh` endpoint is reachable at `NEXT_PUBLIC_API_URL`.

### `NEXT_PUBLIC_API_URL` is wrong after deploy

This variable is **baked in at build time**. Changing it in PM2 `env` does not update the client bundle. You must:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.net npm run build
pm2 reload mycourse-web
```

### TLS certificate renewal fails

```bash
sudo certbot renew --dry-run   # simulate renewal
sudo systemctl status certbot.timer   # is the timer active?
sudo nginx -t                  # valid config after certbot edits?
```

---

## Appendix I — Key Files Reference

| Area | Path | Notes |
|------|------|-------|
| Next.js config + i18n plugin | `next.config.ts` | `createNextIntlPlugin("./src/i18n/request.ts")` |
| Middleware (locale routing) | `src/proxy.ts` → must be `src/middleware.ts` | See Appendix C |
| Root layout | `src/app/layout.tsx` | Fonts (Roboto, Gilroy, GeistMono), Toaster |
| Locale layout | `src/app/[locale]/layout.tsx` | `NextIntlClientProvider` + `AppProviders` (SWR) |
| Web shell layout | `src/app/[locale]/(web)/layout.tsx` | `Header` + `<main>` |
| Home screen | `src/screen/home/page.tsx` | Assembles 7 marketing sections |
| API client instance | `src/api/instance.ts` | Axios + token attach + token refresh interceptors |
| API helpers | `src/api/methods.ts` | `apiFetch`, `apiPost`, `apiPut`, `apiDelete` → `ApiResult<T>` |
| Auth server actions | `src/actions/auth/auth.ts` | `loginAction`, `signupAction` (`"use server"`) |
| Cookie utilities | `src/lib/utils.ts` | `buildCookieOptions`, `getCookieDomain`, `getCookieValue`, `setCookieValue` |
| i18n routing | `src/i18n/routing.ts` | `locales: ["en","vi"]`, `defaultLocale: "vi"`, `localePrefix: "always"` |
| API route constants | `src/constants/api-route.ts` | All API endpoint paths |
| Auth modal store | `src/store/auth/auth.ts` | `useAuthStore` (Zustand) |
| Global error store | `src/store/api-error-store.ts` | `useApiError` (Zustand, max 20 entries) |
| Translation files | `src/messages/en.json` / `vi.json` | English and Vietnamese copy |
| PM2 (dev/staging/prod) | `ecosystem.config.cjs` (repo root) | App names `mycourse-web-dev` / `mycourse-web-staging` / `mycourse-web-prod`; CI reloads **dev** only |

---

*For the full-stack VPS setup (Go API, Postgres, Redis, joint Nginx, CI/CD), always use **`be/docs/deploy.md`** as the primary reference. Use this document for frontend-specific concerns only.*
