## ADDED Requirements

### Requirement: Course slug flows are covered by automated tests
The frontend test suite SHALL cover the slug input filtering and format rule, the course schema slug validation, extraction of the recommended slug from a `3007` response, the create-course conflict confirmation flow (accept, decline, repeated conflict), and the update payload rule that omits an unchanged slug. The browser fixture server SHALL support create and basic-info update requests including a `409` / `3007` response so the slug flows can be exercised end to end.

#### Scenario: Unit coverage exists
- **WHEN** the unit test suite runs
- **THEN** tests for the slug sanitizer and pattern, the course schema slug rule, the recommended-slug extractor, and the create conflict flow pass

#### Scenario: End-to-end conflict flow
- **WHEN** the browser test creates a course with a slug the fixture reports as taken
- **THEN** the recommendation dialog appears and accepting it opens the course editor
