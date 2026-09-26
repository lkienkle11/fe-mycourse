## Purpose

Defines the login and sign up experience as a URL-addressable modal: how it is reached, how a post-login return path is carried and validated, and how it behaves as a normal page when opened directly.

## ADDED Requirements

### Requirement: Login and sign up render as an intercepting modal or a full page
When a visitor navigates to the login or sign up path from within the application (a client-side navigation), the system SHALL render that destination as a modal overlaid on the page the visitor was already viewing. When the same path is opened as a direct navigation (typed URL, hard refresh, bookmark, or shared link) with no valid return-path parameter, the system SHALL render it as an ordinary full page.

#### Scenario: Navigating to login from within the app
- **WHEN** a signed-out visitor triggers navigation to the login path while already viewing another page of the application
- **THEN** the login form renders as a modal over the page the visitor was viewing, and that page remains visible behind it

#### Scenario: Opening the login path directly with no return path
- **WHEN** a visitor requests the login path as a fresh page load (typed URL, refresh, or a link from outside the application) with no valid return-path parameter
- **THEN** the login form renders as a complete standalone page, not as an overlay

#### Scenario: Login and sign up pages are excluded from search indexing
- **WHEN** the full-page login or sign up route is requested
- **THEN** the response instructs search engines not to index or follow it

### Requirement: A direct navigation with a valid return path also renders as a modal over its real background page
When the login or sign up destination is opened as a direct navigation (typed URL, hard refresh, bookmark, or shared link) and carries a valid return-path parameter, the system SHALL render the return path's own page as the background and overlay the login/sign up modal on top of it, matching the experience of reaching that same destination through an in-app navigation. The system SHALL NEVER navigate to, fetch, or otherwise render as background a return-path value that fails the internal-path validation used elsewhere for that parameter - a value that fails validation is discarded before this behavior is considered at all.

#### Scenario: Hard refresh on the login destination with a valid return path
- **WHEN** a visitor hard-refreshes (or directly opens) the login destination while it carries a valid return-path parameter
- **THEN** the return path's own page renders behind a dimmed backdrop, and the login modal renders on top of it, the same as if the visitor had navigated there from within the app

#### Scenario: Hard refresh with no return path shows the plain page
- **WHEN** a visitor hard-refreshes (or directly opens) the login destination with no return-path parameter
- **THEN** the login form renders as a complete standalone page with no background page and no dimmed backdrop

#### Scenario: An invalid return path is never used as a background target
- **WHEN** a visitor hard-refreshes (or directly opens) the login destination with a return-path parameter that fails internal-path validation
- **THEN** the invalid value is discarded and the system never navigates to it, fetches it, or renders it as a background - regardless of which of the two rendering shapes above the visitor ends up seeing

### Requirement: Post-login return path is carried in the URL and validated
The login and sign up destinations SHALL accept an optional return-path parameter in the URL. Before the system ever navigates a visitor to that return path (after a successful login or sign up), it SHALL validate that the path is an internal, relative path belonging to this application, and SHALL discard the value and fall back to a default destination if validation fails.

#### Scenario: Valid internal return path
- **WHEN** the login destination is reached with a return-path parameter that is a relative path starting with a single `/` and contains no scheme or host
- **THEN** a successful login navigates the visitor to that path

#### Scenario: Return path pointing off-application is rejected
- **WHEN** the login destination is reached with a return-path parameter that is an absolute URL, a protocol-relative path (starting with `//`), a backslash-prefixed path, or otherwise resolves outside the application
- **THEN** the system does not navigate to that value, and falls back to its default post-login destination instead

#### Scenario: Missing return path
- **WHEN** the login destination is reached with no return-path parameter
- **THEN** a successful login navigates the visitor to the application's default destination

### Requirement: Switching between login and sign up preserves the return path
While the login/sign up modal or full page is open, the visitor SHALL be able to switch between the login and sign up forms without losing a return-path parameter that was present when they arrived.

#### Scenario: Switching forms keeps the return path
- **WHEN** a visitor on the login destination with a return-path parameter switches to the sign up form (or vice versa)
- **THEN** the sign up destination carries the same return-path parameter

### Requirement: Closing the modal returns to the underlying page
When the login/sign up destination is showing as a modal, the visitor SHALL be able to dismiss it and return to the page it was overlaid on, without the return-path parameter being applied and without leaving the application.

#### Scenario: Dismissing the modal without authenticating
- **WHEN** a visitor dismisses the login/sign up modal without completing login or sign up
- **THEN** the visitor returns to the page that was showing behind the modal, and no navigation to the return-path parameter occurs
