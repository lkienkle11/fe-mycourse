## Purpose

Defines how the frontend represents and consumes the backend user-slug contract (the slug on the current-user profile and on user-identity rows, the course owner slug, and the optional slug in the current-user update body) so that no frontend contract silently omits a field the backend returns.

## ADDED Requirements

### Requirement: Current-user profile exposes the user slug
The frontend current-user profile contract (the response of `GET /api/v1/me` and `PATCH /api/v1/me`) SHALL include the backend-provided `slug` as a string that is always present. An empty string SHALL mean that no slug has been assigned yet and SHALL NOT be treated as an error or replaced with a client-generated value.

#### Scenario: Current user has a slug
- **WHEN** `GET /api/v1/me` returns a non-empty `slug`
- **THEN** the frontend profile contract carries that exact value without trimming, lower-casing or rewriting it

#### Scenario: Current user has no slug yet
- **WHEN** the backend returns `slug: ""` for a user that has not been backfilled
- **THEN** the frontend profile contract represents it as an empty string and no frontend flow fails or invents a slug

### Requirement: Current-user avatar fields are optional
The frontend current-user profile contract SHALL declare `avatar_url` and `avatar_object_key` as optional, because the backend omits either key when it has no value. Consumers SHALL fall back to the initials or placeholder avatar when `avatar_url` is absent or empty.

#### Scenario: Backend omits the avatar URL
- **WHEN** `GET /api/v1/me` returns a body without an `avatar_url` key
- **THEN** the profile contract is valid and the avatar UI renders its fallback instead of an image

#### Scenario: Backend returns an object key
- **WHEN** the response includes `avatar_object_key`
- **THEN** the profile contract represents it as an optional string next to `avatar_url`

### Requirement: Current-user update body accepts an optional slug
The frontend contract for the `PATCH /api/v1/me` body SHALL allow an optional `slug` alongside `avatar_file_id`. The client SHALL omit the `slug` key when the user is not changing it, because an omitted key means "unchanged" and an explicit null or empty value is rejected by the backend with a 400 validation error. The client validation schema for this body SHALL apply the same slug format and maximum length rules as the course and taxonomy slug fields, and SHALL treat a blank value as "do not send".

#### Scenario: Slug omitted from the update body
- **WHEN** a client updates only the avatar
- **THEN** the body contains `avatar_file_id` and no `slug` key

#### Scenario: Valid slug accepted by client validation
- **WHEN** the update schema receives `slug: "my-name-2"`
- **THEN** validation succeeds

#### Scenario: Malformed or over-long slug rejected by client validation
- **WHEN** the update schema receives a slug with uppercase letters, a leading or trailing hyphen, or more than 255 characters
- **THEN** validation fails with the shared slug-format or slug-length message key

#### Scenario: Blank slug is not sent
- **WHEN** the update schema receives `slug: ""`
- **THEN** validation succeeds and the value is understood as "do not send" rather than an instruction to clear the slug

### Requirement: Taken user slugs are never a conflict flow
The frontend SHALL NOT present a slug-conflict confirmation (the recommended-slug flow keyed on error code 3007) for a user slug. The backend resolves a taken user slug by storing a suffixed value and returning it, so the stored slug in the response SHALL be treated as authoritative.

#### Scenario: Requested slug is already taken
- **WHEN** `PATCH /api/v1/me` returns 200 with a slug that differs from the one sent
- **THEN** the frontend contract exposes the returned slug as the user's slug and no conflict dialog is required by this contract

### Requirement: User-identity rows carry the user slug
Every frontend contract that represents a backend user-identity row SHALL include the backend-provided `slug` as a string that is always present: course collaborators (list and bulk-add result), collaborator candidates, instructor roster rows (list and bulk-add result), roster candidates, the current user's instructor application, and the admin instructor application and profile views. An empty string SHALL mean that no slug is assigned.

#### Scenario: Collaborator row includes the slug
- **WHEN** `GET /api/v1/courses/:courseId/collaborators` returns a row with `slug`
- **THEN** the collaborator contract carries that slug together with the user id, role, display name and email

#### Scenario: Picker candidate includes the slug
- **WHEN** a collaborator or roster candidate list returns a row with `slug`
- **THEN** the shared picker candidate contract carries the slug and both feature pickers receive it through the same contract

#### Scenario: Application detail is merged with its list row
- **WHEN** an admin application detail is merged with its list row for display
- **THEN** the merged application keeps the `slug` returned by the backend

#### Scenario: One identity shape for collaborators and candidates
- **WHEN** the collaborator contract and the picker candidate contract describe the same user identity fields
- **THEN** those fields are declared once and the collaborator contract only adds the collaborator role

### Requirement: Course list items carry an optional owner slug
The frontend contract for course list items (course lists, the admin catalog and trash, and the review queue) SHALL include an optional `owner_slug`, because the backend omits the key when it is empty and does not populate it for the instructor's own list or the learner list.

#### Scenario: Owner slug present
- **WHEN** an admin course list item includes `owner_slug`
- **THEN** the list-item contract carries it next to `owner_display_name`

#### Scenario: Owner slug absent
- **WHEN** a course list item has no `owner_slug` key
- **THEN** the contract remains valid and consumers fall back to existing owner display behavior

### Requirement: The slug is display data, never an identity key
The frontend SHALL continue to use the user id (or `user_id` / `course_id`) as the key for identity, cache and request purposes. The user slug SHALL be treated as secondary display data until the backend offers a get-by-slug lookup.

#### Scenario: Selection and cache keys
- **WHEN** a collaborator, candidate or roster member is selected, removed or cached
- **THEN** the operation is keyed by the user id and not by the slug

### Requirement: Test and fixture data mirror the contract
Synthetic data that stands in for backend responses (unit-test factories, test builders and the browser end-to-end fixture server) SHALL include `slug` for user-identity rows and the current-user profile, and SHALL NOT emit an empty-string `avatar_url` that the backend would omit.

#### Scenario: Current-user fixture
- **WHEN** a test builds a current-user profile from the shared factory
- **THEN** the profile includes a non-empty synthetic `slug`

#### Scenario: End-to-end fixture server
- **WHEN** the fixture server answers `GET /api/v1/me`, the collaborators list, the instructor candidates list or the bulk-add result
- **THEN** each user row includes a synthetic `slug`
