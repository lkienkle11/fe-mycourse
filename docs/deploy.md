# Deploying MyCourse Frontend on Ubuntu 24.04

_Last audited: 2026-10-19 (home SEO: metadata, robots.txt and sitemap.xml for /{locale}; noindex /{locale}/home; signed-in /{locale} to /{locale}/home redirect in src/proxy.ts; runtime-only SITE_URL). Prior: 2026-10-16 (signed-in home page: hero carousel, Complete your Course, Trending Course and Popular Instructor read the catalog and learner-courses APIs; temporary `/courses/[slug]` placeholder; `UserAvatar` and `CourseThumbnail` under `src/components/shared`). Prior: 2026-09-16 (added `e2e-browser.yml` browser-test workflow — runs on PRs unlike `deploy-dev.yml`; `test` job now runs the real Jest suite, not a placeholder — see `docs/testing.md`). Prior: 2026-07-09 (CI secrets: dev implemented + stg/main placeholder names); 2026-07-09 (GitHub Actions secrets list + workflow YAML snippet); 2026-06-17._


This is the **frontend** deployment runbook for the MyCourse Next.js application. It uses the same style and naming conventions as **[`be-mycourse/docs/deploy.md`](../../be-mycourse/docs/deploy.md)** — follow that guide first for DNS, Postgres, Redis, and the Go API service.

**Scope of this document:** Next.js-specific steps — environment variables, `next build` / `next start`, Nginx vhost for the web app, PM2 config, and the frontend go-live checklist.

**Replace `yourdomain.net`** with your real domain throughout. Paths below use **`/opt/mycourse/fe`** as a monorepo example; the checked-in **`ecosystem.config.cjs`** supports dynamic paths (runtime deploy uses shared `DEPLOY_PATH`, with optional per-env overrides `DEPLOY_PATH_DEV` / `DEPLOY_PATH_STG` / `DEPLOY_PATH_MAIN`) and defaults to `/var/www/fe-mycourse`, `/var/www/fe-mycourse-staging`, `/var/www/fe-mycourse-prod` — substitute your actual checkout path in every command.

---

## Quick Reference

| Item | Value |
|------|-------|
| App port | `3000` (Next.js production server; staging/prod ports differ in repo `ecosystem.config.cjs`) |
| PM2 process name | **Manual runbook:** `mycourse-web` · **Repo CI (`dev`):** `mycourse-web-dev` (see `ecosystem.config.cjs`) |
| Deploy path | **Example:** `/opt/mycourse/fe` · **CI secret:** `DEPLOY_PATH_DEV` → server directory checked out for `dev` (often `/var/www/fe-mycourse` in `ecosystem.config.cjs`) |
| Nginx vhost | `yourdomain.net` / `www.yourdomain.net` → `127.0.0.1:3000` |
| Required env vars | `NEXT_PUBLIC_API_URL` (must be set **before** `npm run build`); `SITE_URL` (server-only, **runtime** — read from the env file at `next start`, never at build; the server exits at start without a valid value — see [`SITE_URL`](#site_url)) |
| Optional env var | `AUTH_COOKIE_DOMAIN` (needed when FE and API are on different subdomains) |
| Optional stream env | `NEXT_PUBLIC_STREAM_SSE_URL`, `NEXT_PUBLIC_STREAM_WS_URL`, `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` (see [Variable reference table](#variable-reference-table)) |
| Node.js version | 22 LTS (match [backend deploy guide](../../be-mycourse/docs/deploy.md)) |
| GitHub Actions | **Dev:** push **`dev`** → `deploy-dev.yml` test/build; automatic deploy temporarily paused. **Staging / prod:** placeholder `*_STG` / `*_MAIN` secrets — workflows not in repo. **Browser tests:** `e2e-browser.yml` runs on PRs to `dev`/`main` and pushes to `dev` (separate from `deploy-dev.yml`) — see [`testing.md`](./testing.md) ([Appendix G](#appendix-g--cicd-github-actions)). `SITE_URL` is not a GitHub Actions secret and no workflow sets it for the build. |

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
5. **Public site origin:** Decide the canonical frontend origin (e.g. `https://yourdomain.net` or `https://www.yourdomain.net`) — the same host used for the OAuth callback URLs. This is the value for the runtime variable `SITE_URL` (pure `https` origin, no path). Dev and staging servers use their own domain, never the production one.

---

### Step 2 — System update and core packages

Skip if already done in the [backend deploy guide](../../be-mycourse/docs/deploy.md) Step 2. Verify at minimum these packages are present:

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

Skip if done in the [backend deploy guide](../../be-mycourse/docs/deploy.md) Step 7. Confirm the rules are active:

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

Create a **non-committed** env file at the **repository root** (same directory as `package.json`). This file is read by `next build` and `next start`:

```bash
nano /opt/mycourse/fe/.env.production.local
```

#### Required variables

```ini
# Public base URL of the Go API — used by the browser AND by Server Actions.
# Must be HTTPS in production. Set this BEFORE running npm run build.
NEXT_PUBLIC_API_URL=https://api.yourdomain.net

# Canonical public origin of THIS frontend — server-only, read at runtime (not at build).
# Pure https origin: no path, query, hash or credentials. Localhost/loopback is rejected
# when the server runs with NODE_ENV=production (next start), including dev and staging.
# Feeds metadataBase, canonical, hreflang, robots.txt and sitemap.xml. The server logs the
# error and exits with code 1 at start when it is missing or invalid.
SITE_URL=https://yourdomain.net
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
| `SITE_URL` | **Yes** (all `next start` servers) | Server only, **runtime** | Canonical frontend origin used by `src/lib/seo/site-config.ts` (`resolveSiteConfig`) for `metadataBase`, canonical, hreflang, `/robots.txt` and `/sitemap.xml`. Pure `https` origin; loopback hosts are rejected under `NODE_ENV=production`. Validated at server start by `src/instrumentation.ts`. Not a `NEXT_PUBLIC_*` variable, not a build arg, not a CI secret. |
| `NEXT_PUBLIC_STREAM_SSE_URL` | No | Build + client | SSE stream URL; empty → SSE transport not started |
| `NEXT_PUBLIC_STREAM_WS_URL` | No | Build + client | WebSocket URL (`wss://…`); empty → WS not started |
| `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | No | Build + client | API base for NDJSON stream (path `/v1/events/stream` appended) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google login | Build + client | Google Identity Services OAuth client id. Empty disables the Google sign-in button + One Tap. |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | For Discord login | Build + client | Discord OAuth2 client id. Empty disables the Discord sign-in button on the login/signup popup. |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | For Discord login | Build + client | Absolute Discord OAuth redirect URL (e.g. `https://yourdomain.net/auth/discord/callback`). **Must byte-for-byte match the backend `DISCORD_CALLBACK_URL`**, otherwise Discord rejects the exchange (`4023`). |
| `NEXT_PUBLIC_X_CLIENT_ID` | For X login (retained) | Build + client | X (Twitter) OAuth2 client id. X OAuth code remains; not wired to the login/signup popup. |
| `NEXT_PUBLIC_X_CALLBACK_URL` | For X login (retained) | Build + client | Absolute X OAuth redirect URL (e.g. `https://yourdomain.net/auth/x/callback`). **Must byte-for-byte match the backend `X_CALLBACK_URL`**. |

> **`NEXT_PUBLIC_*` warning:** These values are **baked into the JS bundle** at build time. If you change `NEXT_PUBLIC_API_URL` without rebuilding, old client code will still call the previous URL. Always rebuild after changing any `NEXT_PUBLIC_*` variable.

> **`SITE_URL` is the opposite of `NEXT_PUBLIC_*`:** it is **never** baked into the bundle. It is read per request on the server, so changing it needs only a process restart (`pm2 reload … --update-env`), not a rebuild. `npm run build` succeeds with `SITE_URL` unset; `next start` does not.

See also [`delivery.md`](./delivery.md) for envelope format and per-channel behavior.

---

### Step 8 — Install dependencies and build

```bash
cd /opt/mycourse/fe

# Ensure .env.production.local is in place with correct NEXT_PUBLIC_API_URL

# Install exact versions from lockfile (reproducible)
npm ci

# Production build — NEXT_PUBLIC_* variables are read from env/file here
npm run build

# Drop devDependencies from node_modules (smaller disk footprint on VPS)
npm prune --omit=dev
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

Paste the following. For the complete nginx configuration with SSL setup, see **`deploy/nginx/nginx.conf`** in the repository:

```nginx
server {
    listen 80;
    server_name yourdomain.net www.yourdomain.net;

    # Bảo mật Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Tối ưu Cache cực mạnh cho các file tĩnh (CSS/JS) của Next.js
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_set_header Host $host;
    }

    # Bắn mọi luồng traffic khác vào Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;    # BẮT BUỘC tắt để Next.js App Router (Streaming) hoạt động
        proxy_cache off;
    }
}
```

The vhost needs no SEO-specific rule: `/robots.txt` and `/sitemap.xml` are served by Next.js (no static file in nginx), and nginx has no `proxy_cache` for pages (`location /` sets `proxy_cache off`; only `/_next/static/` is cached). The signed-in redirect on `/{locale}` therefore always reaches the Next.js proxy.

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

The repository includes **`ecosystem.config.cjs`** at the frontend root with three apps (`mycourse-web-dev`, `mycourse-web-staging`, `mycourse-web-prod`) and per-environment `cwd` / `env_file`. Runtime deploy can pass shared `DEPLOY_PATH` only (current CI behavior), while per-env overrides (`DEPLOY_PATH_DEV/STG/MAIN`) remain optional. The server env files `.env.local` (dev), `.env.staging` (staging) and `.env.prod` (prod) are the `env_file` defaults and must contain `SITE_URL` for that environment (runtime-only: PM2 passes it to `next start`, nothing is injected at build). CI for **`dev`** reloads **`mycourse-web-dev`** only.

Create or update the PM2 ecosystem file. If you already have one from the backend guide at `/opt/mycourse/ecosystem.config.cjs`, add the `mycourse-web` entry:

```javascript
// /opt/mycourse/ecosystem.config.cjs
module.exports = {
  apps: [
    // --- Go API (from be-mycourse/docs/deploy.md) ---
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
        SITE_URL: 'https://yourdomain.net',
      },
    },
  ],
};
```

> **Note on `NEXT_PUBLIC_*` in PM2:** `NEXT_PUBLIC_API_URL` is baked into the bundle during `npm run build`. Setting it in PM2 `env` provides it for server-side reads at runtime but does **not** change the client bundle. Always ensure the same value is present when building.

> **Note on `SITE_URL` in PM2:** unlike `NEXT_PUBLIC_API_URL`, `SITE_URL` is a pure runtime variable — setting it here (or in the `env_file`) is sufficient and no rebuild is needed. If it is missing or invalid, the process logs `SITE_URL must be a pure public https:// origin in production ...` and exits with code 1 at start (see [Troubleshooting](#siteconfigerror-on-start-server-or-container-exits-immediately)).

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
# Expected: 307 https://yourdomain.net/vi

# Vietnamese home page (guest: no auth cookies)
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi
# Expected: 200

# English home page (guest)
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/en
# Expected: 200

# Signed-in redirect: both refresh_token and session_id cookies present
curl -sS -o /dev/null -D - -H "Cookie: refresh_token=x; session_id=y" https://yourdomain.net/vi \
  | grep -i -E "^(HTTP|location|cache-control|vary)"
# Expected: 307, location: https://yourdomain.net/vi/home, cache-control: private, no-store, vary: Cookie

# Only one of the two cookies (or none) keeps the guest page
curl -sS -o /dev/null -D - -H "Cookie: refresh_token=x" https://yourdomain.net/vi | grep -i -E "^(HTTP|cache-control)"
# Expected: 200, cache-control containing no-store (Next.js dynamic page; no redirect)

# SEO files (the host in the output must be SITE_URL)
curl -sS https://yourdomain.net/robots.txt
# Expected: 200, "Sitemap: https://yourdomain.net/sitemap.xml"
curl -sS https://yourdomain.net/sitemap.xml
# Expected: 200, <loc> entries on the SITE_URL host with hreflang alternates (vi, en, x-default)
```

**Manual checks:**
1. Open `https://yourdomain.net` in a browser — should redirect to `/vi` and render the guest home page (header, body, **footer** with `commonFooter` copy). While logged in, opening `https://yourdomain.net/vi` (or `/en`) must redirect to `/vi/home`; while logged out, opening `https://yourdomain.net/vi/home` must redirect to `/vi`.
2. Click the locale switcher — should navigate to `/en` (or vice versa).
3. Open the login modal, enter credentials — should set cookies and show `UserMenu` (avatar).
4. Hard-refresh — `UserMenu` should still be visible (SWR refetches `GET /api/v1/me`).
5. Open DevTools → Application → Cookies — verify `access_token`, `refresh_token`, `session_id` are present with `SameSite=Lax`, `Domain=.yourdomain.net`, and **`HttpOnly` checked**.
6. View source of `https://yourdomain.net/vi` — `<link rel="canonical">`, `hreflang` alternates and `og:url` use the `SITE_URL` host; `/vi/home` carries `noindex`.
7. **Cloudflare / CDN (outside the repo):** confirm no cache rule or "Cache Everything" page rule covers `/`, `/vi` or `/en`; the signed-in redirect is per user (`Vary: Cookie`, `Cache-Control: private, no-store`) and a shared cache would serve one visitor's redirect to everyone.

---

### Step 13 — Go-live checklist

```
Frontend
  [ ] NEXT_PUBLIC_API_URL is the HTTPS API URL used at build time for this release.
  [ ] AUTH_COOKIE_DOMAIN is set to the parent domain (e.g. yourdomain.net).
  [ ] SITE_URL is set in the server env file (.env.local / .env.staging / .env.prod) to this environment's own https origin (no path; not the production domain on dev/staging) and the process started without exiting on the SITE_URL error.
  [ ] src/proxy.ts exists, locale routing is enforced and a signed-in visit to /vi or /en redirects to /{locale}/home.
  [ ] npm run build completed without errors.
  [ ] npm prune --omit=dev completed (production node_modules only).
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
  [ ] Footer shows localized strings (`commonFooter`) and social icons load.
  [ ] /robots.txt and /sitemap.xml return 200 and reference the SITE_URL host.
  [ ] Cloudflare / CDN does not cache /, /vi or /en (no "Cache Everything"); nginx has no page cache.
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
| `SITE_URL` | **Yes** (every `next start`) | ❌ not read at build | ✅ Server only (request time + `src/instrumentation.ts` at start) | Canonical frontend origin: pure `https` origin, no path/query/hash/userinfo, non-loopback in production (`http://localhost[:port]` / `http://127.0.0.1[:port]` accepted only outside production). Feeds metadata, `/robots.txt`, `/sitemap.xml`. Same host as the OAuth callback origins. |
| `NEXT_PUBLIC_STREAM_SSE_URL` | No | ✅ | ✅ | SSE endpoint; empty disables transport |
| `NEXT_PUBLIC_STREAM_WS_URL` | No | ✅ | ✅ | WebSocket URL; empty disables transport |
| `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | No | ✅ | ✅ | NDJSON stream base URL (appends `/v1/events/stream`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google login | ✅ baked into bundle | — | Google Identity Services client id. **Must be present at build time**, otherwise the Google button throws FE-local `4020 (google_not_configured)`. Empty disables the Google button + One Tap. |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | For Discord login | ✅ baked into bundle | — | Discord OAuth2 client id. Empty disables the Discord button on the login/signup popup. |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | For Discord login | ✅ baked into bundle | — | Absolute Discord redirect URL; must byte-for-byte match backend `DISCORD_CALLBACK_URL`. |
| `NEXT_PUBLIC_X_CLIENT_ID` | For X login (retained) | ✅ baked into bundle | — | X OAuth2 client id. X code retained; not wired to popup. |
| `NEXT_PUBLIC_X_CALLBACK_URL` | For X login (retained) | ✅ baked into bundle | — | Absolute X redirect URL; must byte-for-byte match backend `X_CALLBACK_URL`. |

> **Build-time only:** because `NEXT_PUBLIC_*` are inlined during `next build`, setting these in the PM2 / container runtime env file has **no effect** on the browser bundle. They must be provided to whatever runs `next build` — the CI `build` job (via GitHub Secrets/Variables) or the Docker build-args — and you must **rebuild** after changing them. `SITE_URL` is the reverse: runtime-only, supplied through the env file (PM2 `env_file` / Docker `env_file`), never a CI secret or build arg, and changed with a restart only.

---

## Appendix C — Middleware (Locale Routing)

`src/proxy.ts` wraps the `next-intl` locale proxy and adds the signed-in redirect:

```ts
// src/proxy.ts (shape)
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // 1. next-intl resolves the locale (`/` -> 307 `/{locale}`).
  // 2. Exact locale root (`/vi`, `/en`, optional trailing slash) + BOTH cookies
  //    `refresh_token` and `session_id` (names from src/constants/auth-cookie.ts)
  //    -> 307 `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie`
  //    (next-intl's Set-Cookie is copied onto the redirect).
  // 3. Any other request passes through the next-intl response unchanged.
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
```

Project uses `src/proxy.ts` as the locale proxy and signed-in redirect entry. Keep this file in place and ensure the matcher remains correct. The matcher excludes every path containing a dot, so `/robots.txt` and `/sitemap.xml` (served by `src/app/robots.ts` and `src/app/sitemap.ts`) bypass the proxy.

**OAuth callback exclusion (required):** `/auth/discord/callback` and `/auth/x/callback` are locale-less popup relay routes (`src/app/auth/*/callback/`). They must be excluded from the matcher so next-intl does not redirect them to `/vi/auth/...` (which 404s and breaks Discord/X popup login). `NEXT_PUBLIC_*_CALLBACK_URL` values must remain `<origin>/auth/discord/callback` and `<origin>/auth/x/callback` — not locale-prefixed.

**Caching:** nginx has no page cache (`location /` sets `proxy_cache off`; only `/_next/static/` is cached), so no nginx change is needed for the redirect. Cloudflare / CDN cache rules live outside this repo — check manually that `/`, `/vi` and `/en` are not cached (no "Cache Everything"), otherwise one visitor's redirect can be served to others.

**COOP header (Cloudflare / edge proxy):** Do **not** set `Cross-Origin-Opener-Policy: same-origin` on the FE marketing/auth origin if Discord/Google OAuth popups are used. Restrictive COOP can null `window.opener` and break popup `postMessage` / focus return. FE Next config does not emit COOP; verify Transform Rules / Response Headers at Cloudflare (or nginx). Compatible approach: omit COOP, or use a policy that still allows `window.opener` for same-site popups. `ERR_BLOCKED_BY_CLIENT` is typically an ad-blocker/extension — the API reporter treats it as **expected** (no custom `[API]` Console / Zustand).

Verify locale redirect, the signed-in redirect, SEO files and OAuth callback reachability:

```bash
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:3000/
# Expected: 307  http://127.0.0.1:3000/vi

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/vi
# Expected: 200 (guest)

curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Cookie: refresh_token=x; session_id=y" http://127.0.0.1:3000/vi
# Expected: 307  http://127.0.0.1:3000/vi/home   (Cache-Control: private, no-store; Vary: Cookie)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/robots.txt
# Expected: 200 (served by src/app/robots.ts, not the proxy)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/sitemap.xml
# Expected: 200

curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:3000/auth/discord/callback
# Expected: 200 (no redirect to /vi/auth/discord/callback)

curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/vi/auth/discord/callback
# Expected: 404 (no locale-prefixed callback page — by design)
```

(The loopback checks need a server that started successfully with `NODE_ENV=production`, so its `SITE_URL` must be a valid non-loopback `https` origin, e.g. a fake one such as `https://local.example.test`; the output URLs above still use the loopback request host.)

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
npm prune --omit=dev

# 4. Reload PM2 with zero downtime (graceful reload, not restart)
pm2 reload mycourse-web

# 5. Confirm the new process is healthy
pm2 list
curl -sS -o /dev/null -w "%{http_code}\n" https://yourdomain.net/vi
```

> `pm2 reload` sends a SIGINT, waits for the process to exit cleanly, then starts the new instance. The old instance keeps serving requests during startup of the new one.

> `SITE_URL` is read from the env file at process start. If the release changes it, reload with `pm2 reload ecosystem.config.cjs --only <app> --update-env`; an invalid value makes the new instance log the `SITE_URL` error and exit with code 1 (no rebuild is involved).

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
npm prune --omit=dev

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

### Branch gate: `main` only from `dev`

File: **`.github/workflows/enforce-main-from-dev.yml`**. Trigger: **pull requests targeting `main`**. The job fails unless **`github.head_ref` is `dev`**, so `main` is not updated via PRs from arbitrary feature branches. Combine with **branch protection** on `main` (require the check to pass; avoid direct pushes). Enforcement is **CI-only** (no repo-shipped local git hooks).

---

File: **`.github/workflows/deploy-dev.yml`**. Trigger: **push to `dev`**. Concurrency: `fe-deploy-${{ github.ref }}` with **`cancel-in-progress: true`**.

The active workflow runs **`test` → `build`**. The build job creates frontend bundle outputs on the runner (`.next`, `public`) and uploads them as the **`frontend-runtime`** artifact (`include-hidden-files: true` is required so hidden `.next` is included). Automatic VPS deployment is temporarily paused: the complete **`deploy`** job remains commented, so artifact download/verification, SSH, server Git synchronization, VPS `npm ci`, runtime `rsync`, and PM2 reload do not run. The commented block is the authoritative restoration source. Because the bundle is built in CI, `NEXT_PUBLIC_API_URL` and other required `NEXT_PUBLIC_*` values must remain available in the CI build environment. `SITE_URL` is not one of them: every consumer is request-time (all routes are dynamic; `robots.ts` and `sitemap.ts` are `force-dynamic`), `npm run build` passes with it unset, and it is supplied only by the server env file.

---

### Browser tests (separate workflow, runs on PRs too)

File: **`.github/workflows/e2e-browser.yml`**. Triggers: **pull requests** into `dev`/`main`, and **push to `dev`**. Concurrency: `fe-e2e-${{ github.ref }}` with **`cancel-in-progress: true`**. Unlike `deploy-dev.yml`, this workflow **does** run on pull requests.

Steps: `npm ci` → `npm run test-all` (same gate as `deploy-dev.yml`'s `test` job) → `npx playwright install --with-deps chromium` → `npm run test:e2e` (starts the loopback fixture backend in `e2e/fixtures/server.mjs`, builds the Next app with `NEXT_PUBLIC_API_URL` pointed at it, starts `next start` with the fake site origin `https://e2e.example.test` as `SITE_URL` (`serverEnv` in `scripts/e2e-lifecycle.mjs`), runs Playwright against Chromium, tears down both processes on success or failure). On failure, `playwright-report/` and `test-results/` are uploaded as an artifact. No secrets required — the fixture backend serves only synthetic accounts/tokens. See [`testing.md`](./testing.md) for the full harness. Hosted-run verification on GitHub's own infrastructure is pending until a real run is observed.

### GitHub Actions secrets by environment

Configure under **GitHub → Repository → Settings → Secrets and variables → Actions**.

| Environment | Branch trigger | Workflow | PM2 app | In repo today |
|-------------|----------------|----------|---------|---------------|
| **Dev** | `push` → **`dev`** | `.github/workflows/deploy-dev.yml` | `mycourse-web-dev` | Test/build active; deploy paused |
| **Staging** | `push` → **`staging`** *(planned)* | `.github/workflows/deploy-staging.yml` | `mycourse-web-staging` | No — placeholder secret names only |
| **Production** | `push` → **`main`** *(planned)* | `.github/workflows/deploy-main.yml` | `mycourse-web-prod` | No — placeholder secret names only |

Each environment uses its own `*_DEV` / `*_STG` / `*_MAIN` secrets. **Only `deploy-dev.yml` exists today** — `_STG` and `_MAIN` names are reserved for future workflows; until then use server env files (`.env.staging`, `.env.prod`) and manual deploy per [Step 8](#step-8--install-dependencies-and-build).

#### Dev — test/build active, deploy paused

Workflow: `.github/workflows/deploy-dev.yml` (push to `dev`).

| Secret | Maps to (build job `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(deploy key)* |
| `SSH_HOST` | — | `203.0.113.10` |
| `SSH_USER` | — | `deploy` |
| `DEPLOY_PATH_DEV` | — | `/var/www/fe-mycourse` — must match `cwd` for `mycourse-web-dev` in `ecosystem.config.cjs` |
| `NEXT_PUBLIC_API_URL_DEV` | `NEXT_PUBLIC_API_URL` | `https://api-dev.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_DEV` — empty → FE-local `4020` on Google button |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_DEV` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_DEV` — empty → FE-local `4026` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_DEV` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://dev.example.com/auth/discord/callback` — must match backend `DISCORD_CALLBACK_URL` |
| `NEXT_PUBLIC_X_CLIENT_ID_DEV` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_DEV` |
| `NEXT_PUBLIC_X_CALLBACK_URL_DEV` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://dev.example.com/auth/x/callback` |

**Minimum for dev social login:** SSH trio + `DEPLOY_PATH_DEV` + API URL + Google + Discord client/callback (eight secrets through `NEXT_PUBLIC_DISCORD_CALLBACK_URL_DEV`).

**`SITE_URL` is not a secret:** there is no `SITE_URL_DEV` and nothing maps to `SITE_URL` in the build job `env`. The dev server gets it from `.env.local` on the VPS (PM2 `env_file`), set to the dev domain (never the production one).

#### Staging — placeholder (workflow not in repo)

Planned: `deploy-staging.yml` on push to **`staging`**, reload **`mycourse-web-staging`**, runtime env **`.env.staging`** (carries `SITE_URL` set to the staging domain; no `SITE_URL_STG` secret).

| Secret | Maps to (build job `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(reuse or separate key)* |
| `SSH_HOST_STG` | — | `203.0.113.20` |
| `SSH_USER_STG` | — | `deploy` |
| `DEPLOY_PATH_STG` | — | `/var/www/fe-mycourse-staging` |
| `NEXT_PUBLIC_API_URL_STG` | `NEXT_PUBLIC_API_URL` | `https://api-staging.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_STG` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_STG` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_STG` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_STG` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_STG` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://staging.example.com/auth/discord/callback` |
| `NEXT_PUBLIC_X_CLIENT_ID_STG` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_STG` |
| `NEXT_PUBLIC_X_CALLBACK_URL_STG` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://staging.example.com/auth/x/callback` |

#### Production (`main`) — placeholder (workflow not in repo)

Planned: `deploy-main.yml` on push to **`main`**, reload **`mycourse-web-prod`**, runtime env **`.env.prod`** (carries `SITE_URL` set to the production origin; no `SITE_URL_MAIN` secret).

| Secret | Maps to (build job `env`) | Example placeholder |
|--------|---------------------------|---------------------|
| `SSH_PRIVATE_KEY` | — | *(reuse or separate key)* |
| `SSH_HOST_MAIN` | — | `203.0.113.30` |
| `SSH_USER_MAIN` | — | `deploy` |
| `DEPLOY_PATH_MAIN` | — | `/var/www/fe-mycourse-prod` |
| `NEXT_PUBLIC_API_URL_MAIN` | `NEXT_PUBLIC_API_URL` | `https://api.example.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID_MAIN` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID_MAIN` | `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL_MAIN` | `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | `https://www.example.com/auth/discord/callback` |
| `NEXT_PUBLIC_X_CLIENT_ID_MAIN` *(optional)* | `NEXT_PUBLIC_X_CLIENT_ID` | `YOUR_X_CLIENT_ID_MAIN` |
| `NEXT_PUBLIC_X_CALLBACK_URL_MAIN` *(optional)* | `NEXT_PUBLIC_X_CALLBACK_URL` | `https://www.example.com/auth/x/callback` |

> **SSH naming:** The retained commented dev deploy job uses `SSH_HOST` / `SSH_USER` (no suffix) when restored. Staging/production placeholders use `SSH_HOST_STG` / `SSH_USER_STG` and `SSH_HOST_MAIN` / `SSH_USER_MAIN` when deploy targets differ; on one VPS you may reuse the same `SSH_*` values.

### Job structure

| Job | Responsibility |
|-----|----------------|
| `test` | Checkout, Node 22 (`cache: npm`), `npm ci` + **`npm run test-all`** — fails on ESLint, Biome, a Jest test failure (real suite — see [`testing.md`](./testing.md)), Knip (`deadcode`: unused component/screen files), cycles, or jscpd threshold |
| `build` | After `test`: `npm ci` + `npm run build`, then upload `frontend-runtime` artifact (`.next` + `public`) |
| `deploy` | **Paused:** complete job retained as comments; when restored, runs after `build`, downloads the artifact, performs SSH git sync + `npm ci`, `rsync`s `.next` + `public`, then reloads/starts PM2 |

`e2e-browser.yml`'s single job runs the same `test-all` gate, then Playwright — see "Browser tests" above.

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
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies and run quality checks
        run: |
          npm ci
          npm run test-all

  build:
    needs: test
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
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL_DEV }}
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV }}
          NEXT_PUBLIC_X_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_X_CLIENT_ID_DEV }}
          NEXT_PUBLIC_X_CALLBACK_URL: ${{ secrets.NEXT_PUBLIC_X_CALLBACK_URL_DEV }}
          NEXT_PUBLIC_DISCORD_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_DISCORD_CLIENT_ID_DEV }}
          NEXT_PUBLIC_DISCORD_CALLBACK_URL: ${{ secrets.NEXT_PUBLIC_DISCORD_CALLBACK_URL_DEV }}
        run: |
          npm ci
          npm run build

      - name: Upload frontend runtime artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-runtime
          include-hidden-files: true
          path: |
            .next
            public
          retention-days: 1

#   deploy:
#     runs-on: ubuntu-latest
#     needs: build
#     steps:
#       - name: Download frontend runtime artifact
#         uses: actions/download-artifact@v4
#         with:
#           name: frontend-runtime
#           path: frontend-runtime

#       - name: Verify runtime artifact contents
#         run: |
#           test -d frontend-runtime/.next
#           test -d frontend-runtime/public

#       - name: Setup SSH Agent
#         uses: webfactory/ssh-agent@v0.9.0
#         with:
#           ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

#       - name: Add Server to known_hosts
#         run: ssh-keyscan -H "${{ secrets.SSH_HOST }}" >> ~/.ssh/known_hosts

#       - name: Sync git metadata on server
#         run: |
#           ssh "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" "cd ${{ secrets.DEPLOY_PATH_DEV }} && \
#             git stash -u && \
#             git checkout dev && \
#             git pull && \
#             npm ci"

#       - name: Sync runtime build outputs to server
#         run: |
#           rsync -az --delete "frontend-runtime/.next/" \
#             "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:${{ secrets.DEPLOY_PATH_DEV }}/.next/"
#           rsync -az --delete "frontend-runtime/public/" \
#             "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:${{ secrets.DEPLOY_PATH_DEV }}/public/"

#       - name: Reload PM2 on server
#         run: |
#           ssh "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" "cd ${{ secrets.DEPLOY_PATH_DEV }} && \
#             (export DEPLOY_PATH='${{ secrets.DEPLOY_PATH_DEV }}'; pm2 reload ecosystem.config.cjs --only mycourse-web-dev --update-env || pm2 start ecosystem.config.cjs --only mycourse-web-dev --update-env)"
```

### Notes

- **`DEPLOY_PATH_DEV` / `DEPLOY_PATH_STG` / `DEPLOY_PATH_MAIN`** — frontend checkout roots per PM2 app in `ecosystem.config.cjs`. Only `DEPLOY_PATH_DEV` is used by CI today; `_STG` / `_MAIN` are for planned workflows or manual PM2 on the server.
- **`NEXT_PUBLIC_*_DEV` / `*_STG` / `*_MAIN`** — build-time OAuth/API values baked into the client bundle per environment. Only `*_DEV` secrets are consumed by `deploy-dev.yml` on **`dev`** pushes. Empty Google at dev build → FE-local `4020`; empty Discord → `4026`. Staging/production placeholders follow the same mapping when those workflows are added.
- **Runtime artifact source** — the active build uploads `frontend-runtime`; when deploy is restored, the retained job uses it for `.next` and `public` and installs dependencies on the VPS via `npm ci`.
- **Hidden build directory** — `.next` is hidden; `upload-artifact` must set `include-hidden-files: true` or deploy sync fails with missing `frontend-runtime/.next`.
- **Dependencies on VPS** — while automatic deploy is paused, CI does not run `npm ci` on the VPS. The retained job does so after `git pull` when restored.
- **`NEXT_PUBLIC_*` in CI** — because build happens on runner, these variables must exist in CI (secrets/vars). Changing them requires a new CI build to refresh the client bundle.
- **Default PM2 env files** — `mycourse-web-dev` reads `.env.local`, `mycourse-web-staging` reads `.env.staging`, `mycourse-web-prod` reads `.env.prod` unless you override with `DEPLOY_ENV_FILE_DEV/STG/MAIN`.
- **`AUTH_COOKIE_DOMAIN`** — runtime / server-side for cookies; keep on the server, not required in GitHub Actions for this workflow.
- **`SITE_URL`** — server-only **runtime** variable supplied by the environment's env file (`.env.local` / `.env.staging` / `.env.prod` through PM2 `env_file`, or Docker `env_file`). It is not a GitHub Actions secret and is not added to any `env:` block or build step of `deploy-dev.yml`; the restored deploy job reloads PM2 with `--update-env` and the env file supplies the value.
- **Backend CI** — branch **`master`** currently runs **`test` → `build`** with its complete deploy job also paused as comments — see [backend Appendix C](../../be-mycourse/docs/deploy.md#appendix-c--cicd-with-github-actions).
- **Frontend quality in CI** — [`docs/quality.md`](./quality.md) (`test-all`, `check-all`, `deadcode`, `cycles`, `dupl`, `quality:deps`, `lint`, `biome`). Local only: `fix:biome`, `format:biome`.
- **Frontend test harness** — [`docs/testing.md`](./testing.md) (Jest Node/jsdom + Playwright, `test:e2e` lifecycle, the fixture backend behind `e2e-browser.yml`).

---

## Appendix H — Troubleshooting

### `next build` fails: `Can't resolve 'canvas'` (pdfjs-dist)

`pdfjs-dist` optionally `require`s Node package `canvas` for server-side PDF rendering. Turbopack resolves that import during `next build` even though the browser viewer does not use it.

**Fix (already in repo):**
1. `next.config.ts` → `turbopack.resolveAlias.canvas` → `src/lib/stubs/canvas.ts`
2. `PreviewPdf` loads `preview-pdf-viewer.tsx` via `next/dynamic` with `{ ssr: false }`

After changing either file, run `npm run build` locally before pushing to `dev`.

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

The proxy file is not registered. See [Appendix C](#appendix-c--middleware-locale-routing).

```bash
ls /opt/mycourse/fe/src/proxy.ts   # must exist
# If missing:
# no rename required for this project setup
npm run build && npm prune --omit=dev && pm2 reload mycourse-web
```

### Signed-in visitors are not redirected from `/vi` or `/en` to `/vi/home`

The proxy redirects only when **both** `refresh_token` and `session_id` cookies are sent. Check in DevTools that both exist for the FE host (see `AUTH_COOKIE_DOMAIN`). If the redirect works against `http://127.0.0.1:3000` but not through the public URL, a cache in front of the app is serving a stored response: Cloudflare / CDN must not cache `/`, `/vi`, `/en` (no "Cache Everything"). nginx itself has no page cache.

### `SiteConfigError` on start (server or container exits immediately)

`SITE_URL` is missing or invalid. At start `src/instrumentation.ts` logs `SITE_URL must be a pure public https:// origin in production ...` and exits with code 1 (so PM2 or the container runtime reports the crash instead of serving HTTP 500). Fix the env file used by the process and restart (no rebuild needed):

```bash
pm2 logs mycourse-web-dev --lines 50   # look for the SITE_URL error
grep -n '^SITE_URL=' .env.local        # or .env.staging / .env.prod
```

Typical causes: variable not set in the env file; value has a path, query, hash or credentials (`https://example.com/app`); `http://` used in production; `localhost` / `127.0.0.1` used on a `next start` server (dev, staging and prod servers all run with `NODE_ENV=production`). Use a pure `https` origin of that environment's own domain, e.g. `SITE_URL=https://yourdomain.net`.

### `/robots.txt` or `/sitemap.xml` shows the wrong host

Both are generated per request from `SITE_URL`. Correct the value in the env file and restart; they do not depend on the build or on the request `Host` header.

### Login works but cookies are not sent to the API

Check `AUTH_COOKIE_DOMAIN`. If FE is at `yourdomain.net` and API is at `api.yourdomain.net`, the parent domain must be set so the cookie is scoped to `.yourdomain.net`:

```bash
# In .env.production.local or PM2 env:
AUTH_COOKIE_DOMAIN=yourdomain.net
# Then rebuild + reload
npm run build && npm prune --omit=dev && pm2 reload mycourse-web
```

### Auth tokens expire and the app does not recover

The token refresh path (`refreshBrowserSession` / server writable refresh → `rawPost` in `src/api/core/raw-http.ts`) requires the `refresh_token` and `session_id` cookies. Verify they are present in the browser after login. Also ensure the backend's `/api/v1/auth/refresh` endpoint is reachable at `NEXT_PUBLIC_API_URL`. Silent refresh runs on `X-Token-Expired: true` **or** on `401` when no Bearer was sent but those two cookies exist.

### `NEXT_PUBLIC_API_URL` is wrong after deploy

This variable is **baked in at build time**. Changing it in PM2 `env` does not update the client bundle. You must:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.net npm run build
npm prune --omit=dev
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
| Next.js config + i18n plugin | `next.config.ts` | next-intl plugin; `turbopack.root`, dev memory/cache/logging — see `docs/architecture.md#development-server` |
| Middleware (locale routing + signed-in redirect) | `src/proxy.ts` | next-intl proxy plus `/{locale}` to `/{locale}/home` redirect for requests with both auth cookies; cookie names in `src/constants/auth-cookie.ts` — see Appendix C |
| Site origin config | `src/lib/seo/site-config.ts` | `resolveSiteConfig` reads runtime `SITE_URL` and throws `SiteConfigError` on an invalid value — see [`SITE_URL`](#site_url) |
| Startup validation | `src/instrumentation.ts` | `register()` validates `SITE_URL` at server start (nodejs runtime, `NODE_ENV=production`, skipped during `next build`); on failure logs the error and exits with code 1 |
| robots.txt / sitemap.xml | `src/app/robots.ts`, `src/app/sitemap.ts` | `dynamic = "force-dynamic"`; served outside `src/proxy.ts` (matcher excludes dotted paths); no static copy in `public/` or nginx |
| Root layout | `src/app/layout.tsx` | Fonts (Roboto, Gilroy, GeistMono), Toaster |
| Locale layout | `src/app/[locale]/layout.tsx` | `NextIntlClientProvider` + `AppProviders` (SWR) |
| Web shell layout | `src/app/[locale]/(web)/layout.tsx` | `Header` + `<main>` + `Footer` (from `@/components/common`) |
| Home screen (guest) | `src/screen/common/home/page.tsx` | Assembles 7 marketing sections |
| Signed-in home | `src/screen/common/home/signed-in-home-page.tsx` | Login-required home at `/{locale}/home` (hero, continue learning, trending, popular instructors; client-side API calls); `/{locale}/courses/{slug}` is a temporary placeholder |
| API client transport | `src/api/transport/api-transport.ts`, `src/api/xior/client.ts` | Xior 0.8.3 over Next.js Fetch + runtime auth + refresh |
| API helpers | `src/api/core/methods.ts` | `apiFetch`, `apiPost`, `apiPut`, `apiDelete`, `apiOptions` → `ApiResult<T>` |
| Raw HTTP + barrel | `src/api/core/raw-http.ts`, `src/api/xior/client.ts`, `src/api/index.ts` | Xior-backed `raw*`; `index.ts` re-exports `api*` + `raw*` |
| Auth server actions | `src/actions/auth/auth.ts` | `loginAction`, `registerAction`, `confirmAction`, `logoutAction` (`signupAction` deprecated alias) |
| Cookie utilities | `src/lib/utils/cookie.ts` (+ barrel `index.ts`) | `buildCookieOptions`, `getCookieDomain`, `getCookieValue`, `setCookieValue` (import `@/lib/utils`) |
| Auth session cookies | `src/lib/utils/auth-session.ts` (server-only, **not** in barrel) | `setAuthSessionCookies` — import `@/lib/utils/auth-session` in Server Actions only |
| i18n routing | `src/i18n/routing.ts` | `locales: ["en","vi"]`, `defaultLocale: "vi"`, `localePrefix: "always"` |
| API route constants | `src/constants/api-route.ts` | All API endpoint paths |
| Session/permissions store | `src/store/auth/auth.ts` | `useMeStore` (Zustand) |
| Global error store | `src/store/api-error-store.ts` | `useApiError` (Zustand, max 20 entries) |
| Translation files | `src/messages/en.ts` / `vi.ts` | English and Vietnamese copy; loaded by `loadMessages` |
| PM2 (dev/staging/prod) | `ecosystem.config.cjs` (repo root) | App names `mycourse-web-dev` / `mycourse-web-staging` / `mycourse-web-prod`; CI reloads **dev** only |
| Docker (optional) | `Dockerfile`, `docker/compose.*.yml`, `scripts/docker/*` | Manual container deploy — see **[Appendix J](#appendix-j--docker-alternative-optional)** and [`docs/docker.md`](docker.md) |

---

## Appendix J — Docker alternative (optional)

The primary production path remains **GitHub Actions → CI build artifact (`.next` + `public`) + VPS `npm ci` + PM2** (Appendix G). For local or manual container deploy:

```bash
cp .env.local.example .env.local
./scripts/docker/compose-up.sh local
./scripts/docker/health-check.sh local
```

Full reference: **[`docs/docker.md`](docker.md)** — `NEXT_PUBLIC_*` build-args, runtime-only `SITE_URL` through `env_file`, port matrix, Swarm demo (not for CI).

---

*For the full-stack VPS setup (Go API, Postgres, Redis, joint Nginx, CI/CD), always use **[`be-mycourse/docs/deploy.md`](../../be-mycourse/docs/deploy.md)** as the primary reference. Use this document for frontend-specific concerns only.*


## SITE_URL

`SITE_URL` is the **server-only, runtime-only** canonical origin of this frontend. It feeds `metadataBase`, canonical, hreflang, absolute OG URLs, `/robots.txt` and `/sitemap.xml` through `resolveSiteConfig` in `src/lib/seo/site-config.ts`.

- **Where it comes from:** the per-environment env file (`.env.local` for dev, `.env.staging`, `.env.prod`) via PM2 `env_file` and Docker `env_file`. It is never `NEXT_PUBLIC_`, never a Docker build arg and never a GitHub Actions secret; no CI build step sets it, and `npm run build` passes with it unset (all routes are dynamic; `robots.ts` and `sitemap.ts` are `force-dynamic`).
- **Contract:** a pure absolute origin — scheme + host [+ port], pathname `/` or empty, **no** username/password, **no** query, **no** hash; the trailing slash is normalized away. Values such as `https://example.com/app` or `https://example.com?x=1` are rejected, not stripped. Under `NODE_ENV=production` (every `next start`: dev, staging and prod servers) the scheme must be `https` and the host must not be loopback; outside production `http://localhost[:port]` and `http://127.0.0.1[:port]` are also accepted.
- **Start-up validation:** `src/instrumentation.ts` `register()` validates it when the server starts (nodejs runtime, `NODE_ENV=production`, skipped during `next build`). A missing or invalid value makes the process log `SITE_URL must be a pure public https:// origin in production ...` and exit with code 1 (PM2 / the container runtime reports it) instead of leaving a server that answers every request with HTTP 500.
- **Which host:** the same host (www or apex) as the OAuth callback origins. Dev and staging use their own domain, never the production one. The e2e server uses the fake origin `https://e2e.example.test`.
- Do **not** treat `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_SITE_URL` as the site canonical origin.
- nginx is unchanged (no page cache, no static robots/sitemap). Existing nginx security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) remain the deploy baseline; FE `security-headers-presets.ts` is an inactive draft aligned with them. Cloudflare / CDN cache rules are outside the repo and must not cache `/`, `/vi`, `/en`. See [`seo-ranking-setup.md`](./seo-ranking-setup.md) and [`security-hardening-notes.md`](./security-hardening-notes.md).
