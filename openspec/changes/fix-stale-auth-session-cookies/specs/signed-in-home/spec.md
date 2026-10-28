## MODIFIED Requirements

### Requirement: Login gate on the signed-in home
The `/home` page SHALL show a loading indicator while the current-user request is pending, SHALL show the shared `unauthorized` full-page state (title "Sign in to continue", with a "Sign in" call to action that navigates to the login route with `/home` as the return path) when session cookies exist but no user can be loaded because the session is not valid (visitors without session cookies are redirected to the public homepage before the page renders, see `signed-in-home-entry`), SHALL show the shared `server-error` or `network` full-page state with a retry when the current user could not be loaded because of an outage (see `auth-session-recovery`), and SHALL render the home sections only for a signed-in user. The page SHALL NOT request any home data while no user is signed in or while the outage state is shown.

#### Scenario: Expired session opens /home
- **WHEN** a visitor holding stale session cookies, for whom no user can be loaded, opens `/home`
- **THEN** the page shows the shared `unauthorized` state with the title "Sign in to continue" and a call to action that leads to the login route with `next=/home`
- **AND** no request to the three home endpoints is made

#### Scenario: Current user still loading
- **WHEN** the current-user request has not finished
- **THEN** the page shows a loading indicator and no section content, sign-in prompt or outage state

#### Scenario: Current user could not be loaded because of an outage
- **WHEN** the current-user request fails with a backend failure, a timeout or a network failure and no user is known
- **THEN** the page shows the `server-error` or `network` state with a retry, not the sign-in prompt
- **AND** no request to the three home endpoints is made
- **AND** retrying requests the current user again

#### Scenario: Signed-in user opens /home
- **WHEN** a signed-in user opens `/home`
- **THEN** the hero carousel, Complete your Course, Trending Course and Popular Instructor sections are rendered in that order
