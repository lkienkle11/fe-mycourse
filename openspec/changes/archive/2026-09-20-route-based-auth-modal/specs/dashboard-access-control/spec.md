## ADDED Requirements

### Requirement: Unauthenticated denial automatically prompts login
When the `unauthorized` denial state (no authenticated session) is rendered for a dashboard section, the system SHALL, after a short fixed delay from first showing that state, automatically navigate the visitor to the login destination with the denied route as the return path, so the login modal opens on top of the denial state. This automatic prompt SHALL NOT occur for the `forbidden` denial state (authenticated visitor missing a required permission).

#### Scenario: Unauthenticated denial auto-opens the login modal
- **WHEN** the `unauthorized` denial state renders for a dashboard section and the visitor takes no action
- **THEN** after the fixed delay elapses, the system navigates to the login destination with the denied route as the return path, opening the login modal over the denial state

#### Scenario: Visitor leaves before the delay elapses
- **WHEN** the visitor navigates away from the `unauthorized` denial state, or the visitor's authentication state resolves to authenticated, before the fixed delay elapses
- **THEN** the automatic navigation to the login destination does not occur

#### Scenario: Dismissing the auto-opened modal does not re-trigger it
- **WHEN** a visitor dismisses the login modal that was opened automatically, returning to the `unauthorized` denial state underneath
- **THEN** the automatic prompt does not fire again for that same denial state

#### Scenario: A genuine page reload re-arms the automatic prompt
- **WHEN** a visitor reloads the browser page while on a route whose `unauthorized` denial state had already auto-prompted the login modal earlier in the same visit
- **THEN** the automatic prompt fires again for that reload, unlike dismissing the modal without reloading

#### Scenario: Forbidden denial never auto-opens the login modal
- **WHEN** the `forbidden` denial state renders for a dashboard section
- **THEN** the system does not automatically navigate to the login destination
