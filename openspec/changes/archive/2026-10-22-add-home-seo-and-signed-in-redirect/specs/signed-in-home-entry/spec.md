## Purpose

Defines how a signed-in user is taken to the signed-in home `/{locale}/home` (redirect from the public homepage and the default destination after authentication) and that the signed-in home is never offered to search engines, while the public homepage stays reachable by anonymous visitors and crawlers.

## ADDED Requirements

### Requirement: Redirect signed-in users from the public homepage
When a request targets exactly a locale root (`/vi`, `/en`, with or without a trailing slash) and carries both the `refresh_token` and `session_id` cookies, the system SHALL answer with a temporary redirect (HTTP 307) to `/{locale}/home` of the same locale, without rendering the public homepage. The decision SHALL rely on the presence of the cookies only.

#### Scenario: Signed-in user opens the localised root
- **WHEN** a request for `/en` carries cookies `refresh_token` and `session_id`
- **THEN** the response is 307 with `Location` ending in `/en/home`

#### Scenario: Signed-in user opens the bare root
- **WHEN** a request for `/` carries both cookies
- **THEN** the visitor ends on `/{locale}/home` after following redirects (the locale chosen by the existing locale negotiation)

#### Scenario: Trailing slash
- **WHEN** a request for `/vi/` carries both cookies
- **THEN** the response is a redirect to `/vi/home`

#### Scenario: Only one cookie
- **WHEN** a request for `/vi` carries only `refresh_token` or only `session_id`
- **THEN** the public homepage is served (status 200)

#### Scenario: Other paths untouched
- **WHEN** a request for `/vi/login`, `/vi/courses/some-slug`, `/vi/home` or `/api/...` carries both cookies
- **THEN** no redirect to `/home` is issued by this rule

### Requirement: Anonymous visitors and crawlers keep the public homepage
A request for a locale root without both session cookies SHALL receive the public homepage and SHALL NOT be redirected, so search engines always index `/{locale}` and never a login-gated page.

#### Scenario: Guest
- **WHEN** a request for `/vi` carries no session cookie
- **THEN** the response is 200 with the public homepage

#### Scenario: Crawler user agent
- **WHEN** a search-engine crawler requests `/vi` or `/en` (no cookies)
- **THEN** the response is 200 with the public homepage

### Requirement: Redirect responses are not shared across users
Because the redirect for a locale root depends on cookies, it SHALL carry `Cache-Control: private, no-store` and `Vary: Cookie`, and the locale cookie set by the locale negotiation SHALL be preserved on it. The public homepage response SHALL NOT be storable by shared caches.

#### Scenario: Redirect headers
- **WHEN** the signed-in redirect is issued
- **THEN** the response has `Cache-Control: private, no-store` and `Vary` containing `Cookie`
- **AND** the `NEXT_LOCALE` cookie set by the locale negotiation is present on the redirect

#### Scenario: Guest response is not shared-cacheable
- **WHEN** the public homepage is served for a locale root
- **THEN** its `Cache-Control` contains `no-store`

### Requirement: Guests never see the signed-in home
When a request targets exactly `/{locale}/home` (optional trailing slash) and lacks either the `refresh_token` or the `session_id` cookie, the system SHALL answer with a temporary redirect (HTTP 307) to the public homepage `/{locale}` of the same locale, with `Cache-Control: private, no-store` and `Vary: Cookie`. The signed-in home SHALL NOT render a sign-in prompt for a visitor without session cookies.

#### Scenario: Guest opens the signed-in home
- **WHEN** a request for `/vi/home` carries no session cookie
- **THEN** the response is 307 with `Location` ending in `/vi`

#### Scenario: Only one cookie
- **WHEN** a request for `/en/home` carries only `refresh_token` or only `session_id`
- **THEN** the response is 307 to `/en`

#### Scenario: Signed-in visitor keeps the page
- **WHEN** a request for `/vi/home` carries both cookies
- **THEN** the signed-in home is served and no redirect is issued

### Requirement: Stale cookie does not trap the user
If the session cookies are present but the session is no longer valid, the user SHALL land on the signed-in home, which shows its existing sign-in prompt. The signed-in home SHALL NOT redirect back to the public homepage (the guest redirect above needs both cookies absent, so the two rules cannot loop).

#### Scenario: Expired session
- **WHEN** a visitor with stale `refresh_token` and `session_id` cookies opens `/vi`
- **THEN** they are redirected to `/vi/home` and see the sign-in prompt, with no redirect loop

### Requirement: Default destination after authentication is the signed-in home
After a successful login, social sign-in, email confirmation, or when an already signed-in user opens the login or signup page, and no safe return path was requested, the user SHALL be sent to `/{locale}/home`. When a safe return path was requested it SHALL still take precedence.

#### Scenario: Login without return path
- **WHEN** a user logs in on `/login` with no `next` parameter
- **THEN** they are sent to `/{locale}/home`

#### Scenario: Login popup is dismissed
- **WHEN** a user logs in through the login modal opened from a page and is sent to `/{locale}/home`
- **THEN** no login or signup modal remains on screen over the destination page

#### Scenario: Login from the header link
- **WHEN** a user logs in from the header Login link, which carries `next=/` (the public homepage)
- **THEN** they are sent straight to `/{locale}/home`

#### Scenario: Login with return path
- **WHEN** a user logs in on `/login?next=/instructor`
- **THEN** they are sent to `/instructor`

#### Scenario: Logout destination unchanged
- **WHEN** a user logs out
- **THEN** they are sent to the public homepage `/{locale}`

### Requirement: Signed-in home is not indexable
The page `/{locale}/home` SHALL have its own localised title and SHALL declare robots directives that forbid indexing and following (`noindex, nofollow`). It SHALL NOT declare a canonical URL, Open Graph tags, hreflang alternates or structured data.

#### Scenario: Robots meta
- **WHEN** `/en/home` is requested
- **THEN** the head contains a robots meta with `noindex` and `nofollow`

#### Scenario: No public SEO tags
- **WHEN** `/en/home` is requested
- **THEN** the head contains no `rel="canonical"`, no `og:*` tags and no `hreflang` alternates

#### Scenario: Title
- **WHEN** `/en/home` is requested
- **THEN** the title is a non-empty English string that is not `MyCourse FE`

### Requirement: Existing brand and fallback links keep the public homepage
Brand-logo links, header and dashboard "home" actions, not-found and error "back to home" links SHALL keep pointing to the public homepage `/{locale}`; a signed-in user following them is taken to `/{locale}/home` by the redirect rule.

#### Scenario: Logo for a signed-in user
- **WHEN** a signed-in user clicks the brand logo
- **THEN** they end on `/{locale}/home`

#### Scenario: Logo for a guest
- **WHEN** a guest clicks the brand logo
- **THEN** they end on the public homepage `/{locale}`
