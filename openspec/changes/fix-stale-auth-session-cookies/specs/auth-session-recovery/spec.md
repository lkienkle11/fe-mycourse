## Purpose

Defines what the frontend does when the backend rejects a session refresh: which rejections remove the stored session cookies, which never do, how other open tabs learn that the session ended, and how tabs of one browser avoid refreshing the same session at the same time.

## ADDED Requirements

### Requirement: A rejected refresh that proves the session is dead clears the session cookies
When the backend answers a refresh attempt with HTTP 401 or HTTP 403, the system SHALL remove the access token, refresh token, session id, session-expiry and legacy session-lifetime cookies in the same response that reports the failure, so that the browser no longer holds a session. This SHALL apply to the browser refresh proxy and to refresh attempts made on the server where cookies can be written (Server Actions).

#### Scenario: Browser refresh is rejected as unauthorized
- **WHEN** the browser refresh proxy receives HTTP 401 from the backend for the stored refresh token and session id
- **THEN** the response to the browser removes all five session cookies
- **AND** the failure is still reported to the caller with an allowlisted error code and fixed message, never the backend message

#### Scenario: Browser refresh is rejected as forbidden
- **WHEN** the browser refresh proxy receives HTTP 403 from the backend (for example the user is disabled or banned)
- **THEN** the response to the browser removes all five session cookies

#### Scenario: Server-side refresh is rejected
- **WHEN** a Server Action performs a refresh and the backend answers HTTP 401 or HTTP 403
- **THEN** the session cookies are removed in that request and the action fails as it does today

#### Scenario: Next visit after a dead session
- **WHEN** the cookies were removed by a rejected refresh and the user later requests `/vi` or `/en`
- **THEN** the public homepage is served and no redirect to `/{locale}/home` is issued

### Requirement: Transient or unrelated failures never clear the session cookies
The system SHALL keep the session cookies when a refresh fails for any reason other than HTTP 401 or HTTP 403 from the backend: HTTP 400, HTTP 429, any 5xx, a timeout, a network failure, an unparseable backend response, a failure to persist rotated cookies, and a request that carries no refresh credentials.

#### Scenario: Backend is unavailable
- **WHEN** the refresh attempt ends with a backend 5xx, a timeout or a network error
- **THEN** the session cookies are left untouched and the failure is reported

#### Scenario: Rate limited or malformed request
- **WHEN** the backend answers HTTP 400 or HTTP 429 to the refresh attempt
- **THEN** the session cookies are left untouched

#### Scenario: No credentials to refresh with
- **WHEN** the refresh proxy is called without a refresh token or without a session id
- **THEN** it answers 401 without clearing anything and without announcing a cleared session

#### Scenario: Successful refresh
- **WHEN** the backend rotates the tokens successfully
- **THEN** the cookies are rewritten with the new tokens and none is removed

### Requirement: The browser is told when the session was cleared
When the refresh proxy removed the session cookies, its error response SHALL carry a non-sensitive marker saying so. The marker SHALL be absent from every other error response and from the success response.

#### Scenario: Marker present
- **WHEN** the proxy removed the cookies after a backend 401 or 403
- **THEN** the error response body contains the marker and still contains only the allowlisted code, the fixed message and null data

#### Scenario: Marker absent
- **WHEN** the proxy fails with a 5xx, a timeout, a missing-credentials 401 or any other non-clearing outcome
- **THEN** the error response body does not contain the marker

### Requirement: Other tabs are told that the session ended
When the browser learns that the refresh proxy cleared the session, the system SHALL publish the cross-tab `logout` event with reason `session_expired` exactly once for that refresh outcome. Other tabs of the same browser SHALL react as they already do for a logout (revalidate the current user and reload). The event SHALL NOT be published when the session cookies were not cleared.

#### Scenario: Session cleared
- **WHEN** a tab's refresh ends with the cleared marker
- **THEN** one `logout` event with reason `session_expired` is sent to the other tabs
- **AND** each other tab revalidates the current user and reloads, ending on the public homepage when it was on a signed-in route that requires a session

#### Scenario: Transient failure
- **WHEN** a tab's refresh fails with a 5xx, timeout, network error or a 401 without the cleared marker
- **THEN** no `logout` event is sent

#### Scenario: Several callers share one failed refresh
- **WHEN** several requests in one tab wait on the same refresh and it ends with the cleared marker
- **THEN** the event is sent once, not once per waiting request

#### Scenario: Explicit logout keeps its reason
- **WHEN** a user logs out on purpose
- **THEN** the event still carries reason `user`

### Requirement: Tabs of one browser do not refresh the same session at the same time
Within one browser, the system SHALL allow only one tab at a time to perform a browser refresh. A tab that needs a refresh while another tab is refreshing SHALL wait for it to finish and then perform its own refresh with the cookies the browser holds at that moment. When the browser offers no cross-tab exclusion mechanism, the system SHALL fall back to refreshing without exclusion and SHALL NOT fail the request.

#### Scenario: Two tabs need a refresh together
- **WHEN** two tabs of one browser both receive an expired-token response and start a refresh
- **THEN** their refresh calls to the proxy do not overlap in time
- **AND** the second call sends the cookies written by the first

#### Scenario: Waiting tab after the other tab's session was cleared
- **WHEN** the first tab's refresh ended with the session cleared and the second tab then refreshes
- **THEN** the second tab's call finds no credentials, answers 401 without the cleared marker and sends no further event

#### Scenario: Exclusion unavailable
- **WHEN** the browser does not provide the cross-tab exclusion mechanism
- **THEN** the refresh proceeds without exclusion and the existing within-tab sharing of one in-flight refresh still applies

#### Scenario: A refresh fails while holding the exclusion
- **WHEN** the refresh that holds the exclusion fails, times out or throws
- **THEN** the exclusion is released and the next waiting tab can proceed

### Requirement: Dead-session handling does not change signed-in home navigation rules
This capability SHALL NOT change the proxy's cookie-presence redirects, SHALL NOT make the signed-in home redirect on its own, and SHALL NOT change caching of the public or signed-in home.

#### Scenario: Page open during the failure
- **WHEN** the refresh fails with the session cleared while `/home` is open in that tab
- **THEN** that page keeps showing its sign-in prompt until the user navigates or reloads

### Requirement: A refresh that could not conclude is not treated as a sign-out
When a request is answered with HTTP 401 and the refresh that could have recovered it fails because the backend answered 429 or any 5xx, or because the proxy could not be reached or timed out, the system SHALL report the failure as an unverified session, not as a guest. The failure SHALL stay an HTTP 401 for every existing caller, SHALL carry which kind of outage it was (the backend failed, or no connection), and SHALL NOT clear the session cookies. A refresh answered 400, 401 or 403, a refresh with no credentials, and an unparseable success body SHALL keep the existing guest handling.

#### Scenario: Refresh fails because the backend is failing
- **WHEN** a request is answered 401 and the refresh proxy then answers 500, 502, 503, 504 or 429
- **THEN** the request fails with an HTTP 401 error that is marked as an unverified session with a server-error outage
- **AND** the session cookies are left untouched

#### Scenario: Refresh fails because there is no connection
- **WHEN** a request is answered 401 and the call to the refresh proxy fails at the network level or times out
- **THEN** the request fails with an HTTP 401 error marked as an unverified session with a network outage

#### Scenario: Refresh proves the session is gone or is absent
- **WHEN** a request is answered 401 and the refresh is answered 400, 401 or 403
- **THEN** the request fails with a plain HTTP 401 error that is not marked as an unverified session

#### Scenario: Existing 401 handling is unchanged
- **WHEN** code that tests for an HTTP 401 error receives an unverified-session failure
- **THEN** the test still matches, because the failure is an HTTP error with status 401

#### Scenario: Server Action refresh
- **WHEN** a Server Action refresh fails for any reason
- **THEN** it behaves as before this requirement and does not mark the failure as an unverified session

### Requirement: The current user distinguishes a guest from an outage
The current-user lookup SHALL resolve to "no user" only for a plain HTTP 401 (a guest or a session the backend rejected). A 401 marked as an unverified session, a 5xx, a timeout and a network failure SHALL surface as an error, and the frontend SHALL expose a derived outage state (server-error or network) only when there is no user to show, the lookup is not loading and the error classifies as server-error or network. A 403, a 404 and any other error SHALL NOT produce the outage state.

#### Scenario: Guest
- **WHEN** the current-user request is answered with a plain 401
- **THEN** the lookup resolves to no user and no outage state exists

#### Scenario: Backend failure on the first load
- **WHEN** the current-user request is answered with a 5xx and no user was loaded before
- **THEN** the outage state exists with the server-error variant and a retry that revalidates the current user

#### Scenario: Unverified session
- **WHEN** the current-user request is answered 401 and the refresh behind it did not conclude
- **THEN** the lookup surfaces an error and the outage state exists with the variant of that outage

#### Scenario: A user is already known
- **WHEN** a cached user is available and a later revalidation fails with a 5xx
- **THEN** the outage state does not exist and the cached user stays shown

#### Scenario: Other errors
- **WHEN** the current-user request fails with a 403 or a 404
- **THEN** no outage state exists and the existing handling applies

#### Scenario: Retry
- **WHEN** the outage state is shown and the visitor retries
- **THEN** the current user is requested again and the outage state disappears when the request succeeds
