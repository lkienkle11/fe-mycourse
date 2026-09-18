## Purpose

Defines status-aware error recovery for the frontend: catching render-time failures at the route-segment and root level, and replacing the current single generic "could not load" fallback with a full-page UI that reflects the actual failure category (forbidden, unauthorized, server error, or unreachable network).

## Requirements

### Requirement: Segment-level render errors are caught
Every top-level route group SHALL provide an `error.tsx` boundary so that a rendering exception thrown by any component within that segment is caught and replaced with a recoverable in-app error UI instead of leaving a blank page.

#### Scenario: A component throws during render
- **WHEN** a component inside a route segment throws an error while rendering
- **THEN** the nearest segment `error.tsx` boundary catches it and renders an error UI with a retry action, without crashing the rest of the application shell

### Requirement: Root-level fatal errors are caught
The application SHALL provide a root `global-error.tsx` boundary so that an error escaping every segment boundary, including a failure in the root layout itself, still renders a branded fallback instead of a blank page.

#### Scenario: An error escapes every segment boundary
- **WHEN** an unhandled error occurs outside any segment-level `error.tsx`, or within the root layout
- **THEN** the root `global-error.tsx` boundary renders a fallback UI instead of a blank page

### Requirement: Primary data-load failures render a status-aware full page
When a screen's primary data request fails, the screen SHALL classify the failure into a category (forbidden, unauthorized, server error, network-unreachable) from the underlying error and render a full-page state whose title and description match that category, replacing the single "could not load" fallback currently shown for every failure cause. A 404 or 429 response is not one of these categories — it is out of scope for this classification and keeps the screen's existing generic fallback.

#### Scenario: Access is denied for a specific resource
- **WHEN** the primary data request receives a 403 response
- **THEN** the screen renders the forbidden-variant full-page state describing why access was denied, distinct from other failure states

#### Scenario: Session is unauthenticated
- **WHEN** the primary data request receives a 401 response
- **THEN** the screen renders the unauthorized-variant full-page state, distinct from the forbidden-variant state

#### Scenario: Backend is unreachable or times out
- **WHEN** the primary data request fails with a transport-level network error or timeout and no HTTP response is received
- **THEN** the screen renders the network-variant full-page state, distinct from an HTTP error response

#### Scenario: Backend returns a server error
- **WHEN** the primary data request receives any 5xx response
- **THEN** the screen renders the server-error-variant full-page state

### Requirement: The status-to-category classification is table-driven
The classification in the previous requirement SHALL be implemented as an ordered, declarative lookup (status/range → category), not as a growing chain of conditional branches, so that adding a new status code or category is a new table entry rather than a new branch.

#### Scenario: A new status code needs a category
- **WHEN** a new HTTP status code needs to map to an existing or new full-page category
- **THEN** it is added as a new entry in the classification's lookup table, and no existing entry or the classification function's control flow needs to change

### Requirement: Full-page error states share a single reusable component
Every classified-API-failure full-page state — unauthorized, forbidden, server error, network-unreachable — SHALL be rendered through one shared component so status-driven states are visually and structurally consistent rather than duplicated across screens. The route-level 404 (`NotFoundPage`) is a separate, pre-existing mechanism and is not rendered through this shared component.

#### Scenario: A new failure category needs a full-page state
- **WHEN** a screen needs to render a full-page state for a failure category already defined by this capability
- **THEN** it selects a variant of the shared component rather than introducing a new bespoke full-page layout
