## Purpose

Define the frontend behaviors that the automated regression suite must verify and the evidence required to accept each stage of its introduction.

## ADDED Requirements

### Requirement: Coverage is traceable to accepted behavior
Each required behavior SHALL have a recorded source contract, test location and layer, required outcomes, and implementation status. A discovered mismatch SHALL be recorded and resolved explicitly instead of silently treating existing implementation behavior as correct.

#### Scenario: Test exposes an ambiguous or conflicting expectation
- **WHEN** current behavior conflicts with the documented contract or no expectation can be established
- **THEN** the affected matrix row remains unresolved until its expectation is settled and its test passes; it is not accepted through a skip or weakened assertion

### Requirement: Authentication and permission regressions are exercised
The suite SHALL verify accepted refresh eligibility, malformed token/envelope rejection, bounded retries, session lifecycle, cookie behavior, and permission-driven navigation. Permission tests SHALL distinguish permission inputs from display-only role labels.

#### Scenario: Refresh and permission fixtures vary
- **WHEN** the suite runs allowed, denied, expired, already-retried, and malformed-response cases
- **THEN** it verifies the corresponding accepted request/session/UI outcomes, including error paths and nested menu filtering

### Requirement: Course mutation failure and recovery are covered
The suite SHALL verify collaborator bulk submission and course-outline changes against their accepted contracts, including request payloads, success, partial success where supported, denial, rejection, loading cleanup, and optimistic recovery.

#### Scenario: Collaborator batch partially succeeds
- **WHEN** multiple selected users are submitted and the controlled response reports both successes and failures
- **THEN** the test verifies one bulk request containing all selected IDs and the accepted assignable role, and verifies the consuming UI retains failed selections and reports the partial outcome

#### Scenario: Outline persistence or lease acquisition fails
- **WHEN** the suite exercises lease denial, lease rejection, or persistence rejection
- **THEN** it verifies cache recovery and lease lifecycle against the accepted contract and does not pass solely because a service mock was called

### Requirement: Query and representative domain behavior is covered
The suite SHALL cover disabled/loading/empty/error/success query states, pagination merging and pending behavior, representative form validation/submission, instructor application state, taxonomy validation, media multipart requests, and inbound event normalization.

#### Scenario: Representative domain inputs vary
- **WHEN** valid and invalid inputs and controlled success/error responses are supplied for the selected domains
- **THEN** tests verify returned values, request data, or visible state against each recorded behavior matrix row

### Requirement: Critical browser journeys verify route composition
The browser suite SHALL verify login to a protected screen, logout and expired-session handling, forbidden-response presentation, collaborator submission, outline reorder success and failure recovery, and locale/404 behavior through actual application routes.

#### Scenario: Unknown URL or unsupported locale is requested
- **WHEN** the browser opens the selected unknown-path and unsupported-locale cases
- **THEN** it verifies the accepted not-found content, applicable locale/provider composition, and usable recovery navigation without unhandled rendering errors

#### Scenario: Protected course journey is exercised
- **WHEN** synthetic authenticated and denied sessions traverse the selected protected route and mutation scenarios
- **THEN** the browser checks visible results and recovery behavior while the report clearly limits its claim to frontend behavior against controlled services

### Requirement: Three-stage acceptance is explicit
The initiative SHALL be delivered through three ordered stages: foundation with reference tests; priority auth/course/query flows; browser runtime with representative domain expansion. A stage SHALL be accepted only after its mapped scenarios and existing applicable quality checks pass, with two consecutive successful suite runs from reset test state. Remaining uncovered features SHALL be recorded as a residual backlog.

#### Scenario: A stage is proposed for completion
- **WHEN** its implementation checklist is reviewed
- **THEN** every required row has executable passing evidence, preceding-stage tests still pass, and unresolved required cases prevent completion

#### Scenario: All three stages pass
- **WHEN** the change is proposed for final completion
- **THEN** all required matrix rows are covered and the remaining backlog is explicitly reported without claiming exhaustive application coverage
