## MODIFIED Requirements

### Requirement: Authentication and permission regressions are exercised
The suite SHALL verify accepted refresh eligibility, malformed token/envelope rejection, bounded retries, session lifecycle, cookie behavior, and permission-driven navigation. It SHALL also verify the dead-session handling of refresh: cookies are removed on backend 401 and 403 and kept on 400, 429, 5xx, timeout and network failure, for both the browser refresh proxy and the server-writable refresh; the cleared marker appears only when cookies were removed; the cross-tab `logout` event with reason `session_expired` is sent only in that case; and concurrent refreshes in separate tabs are serialised or fall back without error. It SHALL verify that a refresh that could not conclude (429, 5xx, network failure, timeout) yields an unverified-session 401 with the matching outage, that a plain 401 stays a guest, that the current-user lookup separates a guest from an outage, and that the dashboards, the signed-in home and the become-instructor page show the retryable state for an outage (never the sign-in prompt, never the automatic login modal) and the shared `unauthorized` state for a guest. Permission tests SHALL distinguish permission inputs from display-only role labels.

#### Scenario: Refresh and permission fixtures vary
- **WHEN** the suite runs allowed, denied, expired, already-retried, and malformed-response cases
- **THEN** it verifies the corresponding accepted request/session/UI outcomes, including error paths and nested menu filtering

#### Scenario: Current-user outage fixtures vary
- **WHEN** the suite runs the current-user request answered with a plain 401, a 5xx, a 403, a 404, a network failure and a 401 whose refresh failed with a 5xx
- **THEN** it verifies for each whether the lookup resolves to no user or surfaces an error, whether the outage state exists, and which full-page state each gated screen renders

#### Scenario: Refresh rejection fixtures vary
- **WHEN** the suite runs refresh attempts answered with 401, 403, 400, 429, 500, a timeout and a network failure
- **THEN** it verifies which session cookies remain, whether the cleared marker is present and whether the cross-tab event is sent, for each outcome

### Requirement: Critical browser journeys verify route composition
The browser suite SHALL verify login to a protected screen, logout and expired-session handling, forbidden-response presentation, collaborator submission, outline reorder success and failure recovery, and locale/404 behavior through actual application routes. Expired-session handling SHALL include a session revoked on the backend while its cookies remain: after the failed check the browser holds no session cookie and a later request for the localised root serves the public homepage. It SHALL also include a backend failure on the current-user request while the session is valid: the protected screen shows the retryable state, opens no login modal and keeps the session cookies.

#### Scenario: Unknown URL or unsupported locale is requested
- **WHEN** the browser opens the selected unknown-path and unsupported-locale cases
- **THEN** it verifies the accepted not-found content, applicable locale/provider composition, and usable recovery navigation without unhandled rendering errors

#### Scenario: Protected course journey is exercised
- **WHEN** synthetic authenticated and denied sessions traverse the selected protected route and mutation scenarios
- **THEN** the browser checks visible results and recovery behavior while the report clearly limits its claim to frontend behavior against controlled services

#### Scenario: Current-user request fails while the session is valid
- **WHEN** a signed-in visitor opens a dashboard route and the current-user request is answered 500
- **THEN** the page shows the server-error state with a retry, no login modal opens and the session cookies are still present
- **AND** after the request succeeds again, retrying shows the dashboard

#### Scenario: Session revoked while cookies remain
- **WHEN** a signed-in session is revoked on the backend, the signed-in home is opened and the check fails, and the localised root is then requested
- **THEN** the session cookies are gone and the public homepage is shown instead of a redirect to the signed-in home
