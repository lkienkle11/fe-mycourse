## Purpose

Defines how instructors enter, validate, and reconcile a course slug when creating a course and when editing its basic information, including the recommended-slug confirmation shown when a manual slug is already taken.

## ADDED Requirements

### Requirement: Slug input filters characters as the user types
The slug input SHALL accept only lowercase `a-z`, digits `0-9`, and `-`. Typed or pasted text SHALL be filtered immediately so no other character (uppercase letters, accented or non-Latin letters, emoji, punctuation) can appear in the field, and every space SHALL be replaced by `-`. The input SHALL be editable and SHALL NOT exceed 255 characters.

#### Scenario: Pasted text is filtered
- **WHEN** the user pastes `Khóa Học 01!` into the slug input
- **THEN** the field contains only characters from `a-z`, `0-9`, and `-` with each space converted to `-`

#### Scenario: Uppercase and non-ASCII characters are dropped
- **WHEN** the user types `Go-Ké` into the slug input
- **THEN** the field shows `o-` and no uppercase or accented character remains

#### Scenario: Space becomes a dash
- **WHEN** the user types a space while entering `go course`
- **THEN** the field shows `go-course`

### Requirement: Slug format is validated in the browser for instant feedback
The frontend SHALL treat a non-empty slug as valid only when it matches `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` and is at most 255 characters. A slug that starts or ends with `-` SHALL be rejected with a visible message; consecutive `-` inside the slug SHALL be accepted. Browser validation SHALL NOT replace backend validation: a `400` or `409` returned by the backend SHALL still be surfaced to the user.

#### Scenario: Leading or trailing dash rejected
- **WHEN** the user submits a slug of `-abc` or `abc-`
- **THEN** the form shows a slug format error and no request is sent

#### Scenario: Consecutive dashes accepted
- **WHEN** the user submits the slug `abc---123`
- **THEN** the browser validation passes and the request is sent

### Requirement: Slug is optional when creating a course
The create-course dialog SHALL show an editable slug input that may be left blank. A blank or whitespace-only value SHALL be omitted from the create request so the backend generates the slug from the title. The slug SHALL NOT be derived or auto-filled from the title in the browser, and the create action SHALL NOT be disabled merely because the slug is blank.

#### Scenario: Blank slug omitted
- **WHEN** the user enters a valid title, leaves the slug blank, and submits
- **THEN** the create request contains no slug and the course opens in the editor using the slug returned by the backend

#### Scenario: Manual slug sent
- **WHEN** the user enters a valid title and the slug `golang-course` and submits
- **THEN** the create request contains `slug: "golang-course"`

### Requirement: Slug conflict on create offers the recommended slug
When course creation fails with HTTP `409` and error code `3007`, the frontend SHALL read `data.recommended_slug` and show a confirmation dialog stacked over the create dialog that names the recommended slug and offers Yes and No. Yes SHALL resubmit the create request with the recommended slug as the slug; No SHALL close the confirmation and return to the create form with the user's input intact. If the resubmission again fails with `3007`, the confirmation SHALL be shown again with the newly recommended slug. A `3007` response without a usable `recommended_slug` SHALL be reported with the standard API-error toast.

#### Scenario: User accepts the recommendation
- **WHEN** creation fails with `3007` and `recommended_slug` is `golang-course-x7k92ab` and the user chooses Yes
- **THEN** a create request is sent with `slug: "golang-course-x7k92ab"` and, on success, the created course opens in the editor

#### Scenario: User declines the recommendation
- **WHEN** creation fails with `3007` and the user chooses No
- **THEN** the confirmation closes, the create dialog stays open, and the slug input is editable with the previous value

#### Scenario: Repeated conflict
- **WHEN** the resubmission after Yes fails again with `3007` and a new `recommended_slug`
- **THEN** the confirmation is shown again with the new recommended slug

### Requirement: Slug can be edited with the course basic information
The basic-info editor SHALL show an editable slug field whose default value is the course's current slug. The field SHALL be disabled together with the other basic-info fields while no editable draft exists. The slug SHALL be sent in the update request only when it differs from the current slug; an unchanged slug SHALL be omitted. A blank or whitespace-only slug SHALL be blocked in the form with a visible field error and SHALL NOT be submitted.

#### Scenario: Unchanged slug omitted
- **WHEN** the user edits another field and saves without touching the slug
- **THEN** the update request contains no slug

#### Scenario: Changed slug sent
- **WHEN** the user changes the slug to a valid new value and saves
- **THEN** the update request contains the new slug

#### Scenario: Cleared slug blocked
- **WHEN** the user clears the slug field and saves
- **THEN** a slug-required error is shown on the field and no request is sent

### Requirement: Saved slug reflects the value stored by the backend
After a successful basic-info update the frontend SHALL take the slug from `data.course.slug` in the response as the source of truth for the form and the cached course detail. When that slug differs from the slug that was sent, the frontend SHALL show a notice stating the final slug instead of the plain success message.

#### Scenario: Backend resolves a conflict
- **WHEN** the user saves the slug `golang` that another course owns and the backend responds `200` with `course.slug` equal to `golang-x7k92ab`
- **THEN** the slug field shows `golang-x7k92ab` and a notice states that the slug was changed to `golang-x7k92ab` because it was taken

#### Scenario: Slug stored as sent
- **WHEN** the response slug equals the slug that was sent
- **THEN** the normal success message is shown and the slug field is unchanged

### Requirement: Slug conflict error code is localized
The frontend SHALL map error code `3007` to a localized message in English and Vietnamese so it never falls back to the unknown-error message.

#### Scenario: Code 3007 without a recommendation
- **WHEN** an API error with code `3007` is passed to the standard API-error toast
- **THEN** the toast shows the localized slug-already-exists message
