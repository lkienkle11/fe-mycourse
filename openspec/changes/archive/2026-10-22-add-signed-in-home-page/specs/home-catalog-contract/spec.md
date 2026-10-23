## Purpose

Defines how the frontend consumes the three Home endpoints of the backend (trending courses, popular instructors, continue learning): paths, authentication, limits, response shapes, tolerance for optional or empty fields, and the rule that per-user data never leaks across users.

## ADDED Requirements

### Requirement: Endpoints and authentication
The frontend SHALL read trending courses from `GET /api/v1/catalog/courses/trending` and popular instructors from `GET /api/v1/catalog/instructors/popular`, both without credentials being required by the backend, and SHALL read the learner's continue-learning list from `GET /api/v1/learner-courses/continue`, which requires a signed-in user holding the course-read permission. The optional `limit` query parameter SHALL be sent as a decimal string and SHALL NOT exceed the backend maxima: trending 24 (default 8), popular instructors 12 (default 4), continue learning 10 (default 4).

#### Scenario: Limit above the maximum is never sent
- **WHEN** any caller or hook requests a list
- **THEN** the requested `limit` is at most the endpoint's maximum

#### Scenario: Continue learning needs a session
- **WHEN** no user is signed in
- **THEN** the continue-learning endpoint is not requested

### Requirement: Response shapes
Each endpoint SHALL be read as the standard response envelope whose `data` is an array. A trending item SHALL be read as `id`, `slug`, `title`, `short_description`, optional `thumbnail_url`, optional `owner_display_name`, optional `owner_slug`, `created_at`. A continue-learning item SHALL be read as `course_id`, `slug`, `title`, optional `thumbnail_url`, optional `owner_display_name`, optional `owner_slug`, `completed_sub_lessons`, `total_sub_lessons`, `progress_percent`, `last_activity_at`. A popular-instructor item SHALL be read as `user_id`, `display_name`, `slug`, optional `avatar` (not `avatar_url`), optional `subtitle`, `course_count`. A `null` or missing `data` SHALL be read as an empty list.

#### Scenario: Null data
- **WHEN** an endpoint responds successfully with `data` null
- **THEN** the frontend treats the result as an empty list

#### Scenario: Instructor picture key
- **WHEN** a popular-instructor item carries `avatar`
- **THEN** the frontend uses that value as the picture URL and does not look for `avatar_url`

### Requirement: Tolerance for absent and empty slugs
`owner_slug` MAY be absent, and `slug` MAY be the empty string, until the backend backfill has run in an environment. The frontend SHALL test these values for being falsy and SHALL NOT compare them to a literal, SHALL NOT treat their absence as an error and SHALL NOT use them as identity keys.

#### Scenario: owner_slug key absent
- **WHEN** a trending item has no `owner_slug` key
- **THEN** the item is valid and displayed

#### Scenario: Empty instructor slug
- **WHEN** a popular instructor has `slug` equal to the empty string
- **THEN** the item is valid and displayed

### Requirement: No cross-user reuse of continue-learning data
Continue-learning data SHALL be requested only while a user is signed in and SHALL NOT be shown to a different user who signs in later in the same browser session. Trending and popular-instructor data MAY be shared across users.

#### Scenario: User switch in one session
- **WHEN** user A signs out and user B signs in without a full page reload
- **THEN** user B never sees user A's continue-learning items

### Requirement: Failure behaviour
A failed request SHALL be surfaced to the section that issued it as an error state, SHALL NOT be retried in a tight loop (the existing application error-retry interval applies), and SHALL be reported through the existing API error reporting. Public endpoints SHALL NOT be requested through the public cache profile registry in this release.

#### Scenario: Repeated failure
- **WHEN** a request keeps failing
- **THEN** automatic retries respect the configured error-retry interval and the user can retry manually
