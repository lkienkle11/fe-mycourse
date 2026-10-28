## MODIFIED Requirements

### Requirement: Stale cookie does not trap the user
If the session cookies are present but the session is no longer valid, the user SHALL land on the signed-in home, which shows the shared `unauthorized` state with its sign-in call to action, and the failed refresh that reveals the dead session SHALL remove the stale session cookies (see `auth-session-recovery`) so that the next request for the public homepage is served instead of being redirected back to the signed-in home. The signed-in home SHALL NOT redirect back to the public homepage on its own (the guest redirect above needs both cookies absent, so the two rules cannot loop).

#### Scenario: Expired session
- **WHEN** a visitor with stale `refresh_token` and `session_id` cookies opens `/vi`
- **THEN** they are redirected to `/vi/home` and see the sign-in prompt (the shared `unauthorized` state), with no redirect loop

#### Scenario: Next visit after the dead session was detected
- **WHEN** the visitor from the previous scenario has had their session rejected by the backend and later opens `/vi` again
- **THEN** the public homepage is served with status 200 and no redirect to `/vi/home` is issued

#### Scenario: Dead session is not detected
- **WHEN** the backend is unreachable or answers 5xx during the refresh
- **THEN** the cookies stay, and the visitor keeps being redirected to `/vi/home`, where the page shows a retryable `server-error` or `network` state (see `signed-in-home`) instead of claiming the visitor is signed out
