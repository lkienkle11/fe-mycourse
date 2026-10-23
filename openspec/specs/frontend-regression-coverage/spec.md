## Purpose

Define the frontend behaviors that the automated regression suite must verify and the evidence required to accept each stage of its introduction.

## Requirements

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
</content>

### Requirement: Course slug flows are covered by automated tests
The frontend test suite SHALL cover the slug input filtering and format rule, the course schema slug validation, extraction of the recommended slug from a `3007` response, the create-course conflict confirmation flow (accept, decline, repeated conflict), and the update payload rule that omits an unchanged slug. The browser fixture server SHALL support create and basic-info update requests including a `409` / `3007` response so the slug flows can be exercised end to end.

#### Scenario: Unit coverage exists
- **WHEN** the unit test suite runs
- **THEN** tests for the slug sanitizer and pattern, the course schema slug rule, the recommended-slug extractor, and the create conflict flow pass

#### Scenario: End-to-end conflict flow
- **WHEN** the browser test creates a course with a slug the fixture reports as taken
- **THEN** the recommendation dialog appears and accepting it opens the course editor

### Requirement: Taxonomy slug flows are covered by automated tests
The frontend test suite SHALL cover the taxonomy slug schema rule, the create and update payload rules (blank omitted on create, unchanged omitted on update, never an empty slug), the tree write payload rule for new, untouched, edited, and cleared node slugs and node slug validation, the shared create-with-slug-conflict flow (accept, decline, repeated conflict, unusable recommendation) as used by both course and taxonomy creation, and the taxonomy dialog and tree editor behaviours (editable slug input, adjusted-slug notices, node inline edit). The browser fixture server SHALL support taxonomy create, update, and detail requests including a `409` / `3007` response with `data.recommended_slug` and a seeded tree so these flows can be exercised end to end.

#### Scenario: Unit and component coverage exists
- **WHEN** the unit test suite runs
- **THEN** tests for the taxonomy slug schema, the taxonomy payload builders, the tree write payload, the shared conflict flow, the taxonomy dialog, and the tree editor pass, and the existing course create flow tests still pass unchanged in behaviour

#### Scenario: End-to-end conflict flow
- **WHEN** the browser test creates a taxonomy item with a slug the fixture reports as taken
- **THEN** the recommendation dialog appears and accepting it creates the item and refreshes the list

#### Scenario: End-to-end tree node slug flow
- **WHEN** the browser test edits a topic, changes one node slug, and saves
- **THEN** the update request carries only that node's slug and the untouched nodes omit it

### Requirement: Consolidated shared capabilities are guarded by behaviour tests
Every shared module that replaces previously duplicated logic SHALL have direct unit tests, and every consumer that is migrated onto it SHALL keep its existing observable behaviour, verified by its existing tests or by characterization tests written before the migration. This covers the optional-field payload rule, the nested-tree utilities (count, depth, find, path, walk, immutable update), the generic validation-message resolver, the labelled field block, the dashboard breadcrumb resolution, the dagre flow-element generation, and the authentication form field errors.

#### Scenario: Shared utility behaviour is specified directly
- **WHEN** the unit test suite runs
- **THEN** tests for the payload rule, the tree utilities, and the validation-message resolver pass, including blank/whitespace, nested, empty, not-found, and immutability cases

#### Scenario: Migrated consumers keep their behaviour
- **WHEN** the course create flow, the course payload builders, the dashboard breadcrumb resolver, the taxonomy tree view, and the login/signup field validation are exercised after the consolidation
- **THEN** their existing and characterization tests pass without changed expectations
