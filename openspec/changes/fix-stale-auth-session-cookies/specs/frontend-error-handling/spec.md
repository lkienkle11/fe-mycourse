## ADDED Requirements

### Requirement: Sign-in gates use the shared unauthorized state
Every screen that asks a visitor to sign in before showing its content (dashboards, the signed-in home, the become-instructor page when the visitor is not signed in) SHALL render that request through the shared full-page component with the `unauthorized` variant, with the screen's own title, description and a sign-in call to action when the default copy does not fit, instead of a bespoke layout.

#### Scenario: Signed-in home asks for sign-in
- **WHEN** the signed-in home needs a signed-in user and none is available
- **THEN** it renders the shared full-page component with the `unauthorized` variant and a sign-in call to action

#### Scenario: Become-instructor page asks for sign-in
- **WHEN** the become-instructor page is opened by a visitor who is not signed in
- **THEN** it renders the shared full-page component with the `unauthorized` variant and a sign-in call to action that returns to the become-instructor page after login

### Requirement: A failed current-user lookup renders a retryable status-aware state
When the current-user request fails because of a backend failure, a timeout or a network failure, the screens that gate on the signed-in user SHALL render the shared full-page component with the `server-error` or `network` variant and a retry action that requests the current user again, and SHALL NOT render the sign-in request in its place.

#### Scenario: Gated screen with a failed current-user lookup
- **WHEN** a screen that gates on the signed-in user is opened and the current-user request fails with a 5xx, a timeout or a network failure
- **THEN** it shows the matching `server-error` or `network` state with a retry action instead of the sign-in request

#### Scenario: Retry succeeds
- **WHEN** the visitor retries and the current-user request succeeds
- **THEN** the gated screen renders its normal content

### Requirement: The status classification covers an unverified session
The classification of a failure into a full-page category SHALL map a 401 that is marked as an unverified session (a refresh that could not conclude) to the `server-error` or `network` category carried by that marker, and SHALL keep mapping a plain 401 to `unauthorized`. The mapping SHALL stay table-driven for HTTP statuses; the unverified-session case is a single typed check ahead of the status table.

#### Scenario: Unverified session classified
- **WHEN** a failure is a 401 marked as an unverified session with a network outage
- **THEN** it classifies as `network`

#### Scenario: Plain 401 classified
- **WHEN** a failure is a plain HTTP 401
- **THEN** it classifies as `unauthorized`
