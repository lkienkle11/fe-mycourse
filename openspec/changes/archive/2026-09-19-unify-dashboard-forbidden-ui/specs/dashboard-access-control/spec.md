## Purpose

Defines the client-side permission gate shared by every instructor, admin, and sysadmin dashboard route: what triggers a denial, and what full-page state the visitor sees for each denial reason.

## ADDED Requirements

### Requirement: Every dashboard section enforces a permission gate
Each top-level dashboard route group (instructor, admin, sysadmin) SHALL check the current visitor against that section's required permission set before rendering the section's own content, and SHALL apply this check uniformly to every route nested under that section.

#### Scenario: Visitor lacks any required permission for the section
- **WHEN** a visitor navigates to a route under a dashboard section whose required permissions they do not hold
- **THEN** the section's own content is not rendered, and a denial state is shown instead

### Requirement: Denial reason determines which full-page state renders
When the permission gate denies access, the section SHALL render the shared status-aware full-page component, using the `unauthorized` variant when the visitor has no authenticated session and the `forbidden` variant when the visitor is authenticated but lacks the required permission(s), so the visitor can tell "log in" apart from "you don't have access" cases.

#### Scenario: Unauthenticated visitor is denied
- **WHEN** a visitor with no authenticated session is denied access to a dashboard section
- **THEN** the `unauthorized` variant of the shared full-page state is rendered

#### Scenario: Authenticated visitor without the required permission is denied
- **WHEN** an authenticated visitor who lacks the section's required permission(s) is denied access to a dashboard section
- **THEN** the `forbidden` variant of the shared full-page state is rendered

### Requirement: Denial state keeps the visitor able to recover
A rendered denial state SHALL leave the visitor able to act on it: the dashboard header and its authentication entry point SHALL remain visible alongside the denial state, and the denial state SHALL offer a way back to a part of the application the visitor can reach.

#### Scenario: Denial state is shown to a visitor
- **WHEN** a denial state is rendered for any dashboard section
- **THEN** the dashboard header, including its login/signup entry point, remains visible, and the denial state includes an action that navigates the visitor to a reachable page
