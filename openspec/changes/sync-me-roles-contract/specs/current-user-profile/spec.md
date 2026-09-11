## Purpose

Defines how the frontend represents the backend current-user profile while keeping display role names separate from permission-based authorization.

## ADDED Requirements

### Requirement: Frontend current-user contract includes roles
The frontend current-user profile contract SHALL include the backend-provided `roles` field as a required array of strings without client-side filtering, narrowing, or reordering.

#### Scenario: Current user has ordered roles
- **WHEN** `GET /api/v1/me` or `PATCH /api/v1/me` returns one or more role names
- **THEN** the frontend profile contract represents every role name in the backend-provided order

#### Scenario: Current user has no roles
- **WHEN** the backend returns `roles: []`
- **THEN** the frontend profile contract represents the field as an empty array rather than treating it as missing or null

#### Scenario: Backend returns an unknown role name
- **WHEN** the backend includes a role name outside the frontend's known role constants
- **THEN** the frontend profile contract still represents that role name without a type or parsing failure

### Requirement: Roles remain display-only
The frontend SHALL NOT use the current-user `roles` projection as an authorization decision input; permission-based access checks SHALL continue to use `permissions`.

#### Scenario: Role and permission data disagree
- **WHEN** a current-user response contains a role name but lacks a permission required by a frontend gate
- **THEN** the gate denies access according to `permissions` regardless of the role name
