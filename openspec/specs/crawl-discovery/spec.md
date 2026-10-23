# crawl-discovery Specification

## Purpose
Defines the `robots.txt` and `sitemap.xml` endpoints so crawlers can discover the public homepage in every locale, are told not to crawl private areas, and find the sitemap, without those endpoints being redirected, localised or cached with a build-time site origin.

## Requirements

### Requirement: robots.txt endpoint
The site SHALL serve `/robots.txt` (not locale-prefixed, not redirected) with a `User-agent: *` group that allows the localised public homepage roots and disallows, for every supported locale, every private route prefix (admin, instructor, sysadmin, account areas, signed-in home and private resource routes), and that declares the absolute sitemap URL built from the configured site origin.

#### Scenario: Private areas disallowed in every locale
- **WHEN** `/robots.txt` is requested
- **THEN** the response is 200 plain text containing `Disallow: /vi/admin`, `Disallow: /en/admin`, `Disallow: /vi/home` and `Disallow: /en/home`

#### Scenario: Public homepage allowed
- **WHEN** `/robots.txt` is requested
- **THEN** it contains `Allow: /vi` and `Allow: /en`

#### Scenario: Sitemap declared
- **WHEN** `/robots.txt` is requested and the site origin is `https://example.com`
- **THEN** it contains the line `Sitemap: https://example.com/sitemap.xml`

#### Scenario: Not redirected by locale handling
- **WHEN** `/robots.txt` is requested without a locale prefix
- **THEN** the response is served directly, not redirected to a locale-prefixed path

### Requirement: sitemap.xml endpoint
The site SHALL serve `/sitemap.xml` (not locale-prefixed, not redirected) listing only the SEO-indexable public pages. Each entry SHALL be an absolute URL on the configured site origin with language alternates for every supported locale and `x-default`. Auth flows (login, signup, confirm-email, logout), the signed-in home and every private route SHALL NOT appear.

#### Scenario: Homepage listed with alternates
- **WHEN** `/sitemap.xml` is requested and the site origin is `https://example.com`
- **THEN** it contains an entry for `https://example.com/vi` with alternates for `vi`, `en` and `x-default`

#### Scenario: Non-indexable pages excluded
- **WHEN** `/sitemap.xml` is requested
- **THEN** it contains no URL ending in `/login`, `/signup`, `/confirm-email`, `/logout` or `/home`, and no URL under `/admin`, `/instructor`, `/sysadmin`

### Requirement: Site origin read at request time
The robots and sitemap endpoints SHALL read the site origin when a request is served, not when the application is built, so a build produced without the site origin variable still serves correct absolute URLs once the variable is set on the running server.

#### Scenario: Build without the variable
- **WHEN** the application is built with `SITE_URL` unset and later started with `SITE_URL=https://example.com`
- **THEN** `/robots.txt` and `/sitemap.xml` contain `https://example.com` URLs

### Requirement: Endpoints fail loudly on an invalid origin
When the site origin is missing or invalid, the robots and sitemap endpoints SHALL NOT emit URLs on a guessed or placeholder origin.

#### Scenario: Missing origin
- **WHEN** a non-production server without a valid `SITE_URL` receives a request for `/sitemap.xml`
- **THEN** the response is an error, not a document with invented URLs
