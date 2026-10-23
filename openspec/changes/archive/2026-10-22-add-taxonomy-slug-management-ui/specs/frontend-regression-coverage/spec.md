## ADDED Requirements

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
