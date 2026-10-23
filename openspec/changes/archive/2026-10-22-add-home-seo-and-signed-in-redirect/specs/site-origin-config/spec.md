## Purpose

Defines the `SITE_URL` server variable that provides the public origin used for canonical, language alternate, Open Graph and sitemap URLs: which values are accepted per environment, when it is read, and what happens when it is wrong, so SEO URLs are never built on a guessed origin.

## ADDED Requirements

### Requirement: SITE_URL is a server-only runtime variable
The site origin SHALL be read only from the server environment variable `SITE_URL` when a request is served. It SHALL NOT use a `NEXT_PUBLIC_` variable, SHALL NOT be derived from the API URL, and SHALL NOT be required to build the application or its container image.

#### Scenario: Build without the variable
- **WHEN** the application is built with `SITE_URL` unset
- **THEN** the build succeeds

#### Scenario: Not exposed to the browser
- **WHEN** any client bundle is inspected
- **THEN** it contains no reference to the `SITE_URL` value

### Requirement: Accepted values in production
In production (the server running with `NODE_ENV=production`, which covers dev, staging and production deployments started with `next start`), `SITE_URL` SHALL be a pure `https://` origin: a host with an optional port, no path other than `/`, no query, no fragment, no username or password. A loopback host (`localhost`, `127.0.0.1`, `::1`) SHALL be rejected.

#### Scenario: Valid origin
- **WHEN** `SITE_URL=https://example.com` in production
- **THEN** it is accepted and the origin used is `https://example.com`

#### Scenario: Trailing slash
- **WHEN** `SITE_URL=https://example.com/` in production
- **THEN** it is accepted and normalised to `https://example.com`

#### Scenario: Rejected values
- **WHEN** `SITE_URL` is `http://example.com`, `https://example.com/vi`, `https://example.com?x=1`, `https://user:pw@example.com`, `https://localhost:3000` or empty, in production
- **THEN** it is rejected as invalid

### Requirement: Accepted values outside production
Outside production (local development and tests), `SITE_URL` SHALL additionally accept `http://localhost[:port]` and `http://127.0.0.1[:port]`. Every other rule of the production contract still applies (no path, query, fragment or credentials; any other host requires `https`).

#### Scenario: Local development
- **WHEN** `SITE_URL=http://localhost:3000` and `NODE_ENV` is not `production`
- **THEN** it is accepted

#### Scenario: Plain http for a real host
- **WHEN** `SITE_URL=http://example.com` and `NODE_ENV` is not `production`
- **THEN** it is rejected

### Requirement: Production server refuses to start with a bad origin
When the production server starts (not during the build phase), it SHALL validate `SITE_URL` and SHALL fail to start with an error that names the problem when the value is missing or invalid, instead of starting and failing requests later.

#### Scenario: Missing at startup
- **WHEN** the production server is started without `SITE_URL`
- **THEN** startup fails with an error stating that `SITE_URL` must be a pure https origin

#### Scenario: Valid at startup
- **WHEN** the production server is started with `SITE_URL=https://example.com`
- **THEN** startup succeeds

#### Scenario: Build phase
- **WHEN** `next build` runs without `SITE_URL`
- **THEN** no validation error is raised

### Requirement: No guessed origin
When the origin is missing or invalid, any SEO output that needs an absolute URL (metadata, robots, sitemap) SHALL fail rather than emit a placeholder or inferred origin.

#### Scenario: Metadata with a missing origin
- **WHEN** homepage metadata is generated while `SITE_URL` is missing
- **THEN** generation fails with a configuration error and no canonical URL is produced
