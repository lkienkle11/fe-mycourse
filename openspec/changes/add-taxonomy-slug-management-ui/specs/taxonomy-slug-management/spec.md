## Purpose

Defines how administrators enter, validate, and reconcile the slug of a course level, course topic, course skill, or tag, and the slug of each tree node inside a topic or skill, when creating and editing taxonomy items, including the recommended-slug confirmation shown when a manual slug is already taken on create.

## ADDED Requirements

### Requirement: Taxonomy slug input filters characters as the user types
Every slug input in the taxonomy create/edit dialog (the item slug and each tree node slug) SHALL accept only lowercase `a-z`, digits `0-9`, and `-`. Typed or pasted text SHALL be filtered immediately so no other character can appear, every space SHALL be replaced by `-`, and the value SHALL NOT exceed 255 characters. The rule SHALL be identical to the course slug input.

#### Scenario: Pasted text is filtered
- **WHEN** the admin pastes `Khóa Học 01!` into the item slug input
- **THEN** the field contains only characters from `a-z`, `0-9`, and `-`, with each space converted to `-`

#### Scenario: Tree node slug input is filtered the same way
- **WHEN** the admin types `Sub Topic!` into a tree node slug input
- **THEN** the field contains only `a-z`, `0-9`, and `-` characters

### Requirement: Taxonomy slug format is validated in the browser for instant feedback
A non-empty slug SHALL be accepted by the browser only when it matches `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` and is at most 255 characters; a slug starting or ending with `-` SHALL be rejected with a visible message and consecutive `-` SHALL be accepted. Browser validation SHALL NOT replace backend validation: a `400` or `409` from the backend SHALL still be surfaced.

#### Scenario: Leading or trailing dash rejected
- **WHEN** the admin submits an item slug of `-beginner` or `beginner-`
- **THEN** the form shows a slug format error and no request is sent

#### Scenario: Consecutive dashes accepted
- **WHEN** the admin submits the slug `abc---123`
- **THEN** browser validation passes and the request is sent

### Requirement: Slug is optional when creating a taxonomy item
The create dialog for levels, topics, skills, and tags SHALL show an editable slug input that may be left blank. A blank or whitespace-only value SHALL be omitted from the create request so the backend generates the slug from the name. The slug SHALL NOT be derived, previewed, or auto-filled from the name in the browser, and the create action SHALL NOT be disabled merely because the slug is blank. The same behaviour SHALL apply on both the admin and the sysadmin taxonomy screens. Course outcomes SHALL NOT show a slug input.

#### Scenario: Blank slug omitted
- **WHEN** the admin enters a valid name, leaves the slug blank, and submits
- **THEN** the create request contains no slug and the dialog closes after the backend creates the item

#### Scenario: Manual slug sent
- **WHEN** the admin enters a valid name and the slug `beginner-level` and submits
- **THEN** the create request contains `slug: "beginner-level"`

#### Scenario: Renaming in the form does not touch the slug field
- **WHEN** the admin types a name in the create dialog while the slug input is blank
- **THEN** the slug input stays blank and no derived slug preview is shown

### Requirement: Slug conflict on create offers the recommended slug
When creating a taxonomy item fails with HTTP `409` and error code `3007`, the frontend SHALL read `data.recommended_slug` and show a confirmation dialog stacked over the create dialog that names the recommended slug and offers Yes and No. Yes SHALL resubmit the create request with the recommended slug; No SHALL close the confirmation and return to the form with the user's input intact. If the resubmission fails again with `3007`, the confirmation SHALL be shown again with the new recommendation. A `3007` without a usable `recommended_slug` SHALL be reported with the standard API-error toast. The confirmation text SHALL refer to the item being created and SHALL NOT mention courses. The create conflict flow SHALL share its behaviour with the course create flow.

#### Scenario: User accepts the recommendation
- **WHEN** creating a tag fails with `3007` and `recommended_slug` is `beginner-x7k92ab` and the admin chooses Yes
- **THEN** a create request is sent with `slug: "beginner-x7k92ab"` and, on success, the dialog closes and the list refreshes

#### Scenario: User declines the recommendation
- **WHEN** creating a topic fails with `3007` and the admin chooses No
- **THEN** the confirmation closes, the create dialog stays open, and every field including the slug keeps its previous value

#### Scenario: Repeated conflict
- **WHEN** the resubmission after Yes fails again with `3007` and a new `recommended_slug`
- **THEN** the confirmation is shown again with the new recommended slug

### Requirement: Slug can be edited with the taxonomy item
The edit dialog SHALL show the slug input seeded with the item's persisted slug. The slug SHALL be sent in the update request only when its trimmed value differs from the persisted slug; an unchanged slug SHALL be omitted, including when the name or translations change in the same request. A blank or whitespace-only slug on an existing item SHALL be blocked in the form with a visible field error and SHALL NOT be submitted.

#### Scenario: Name changed, slug untouched
- **WHEN** the admin renames a level and saves without touching the slug
- **THEN** the update request contains no slug and the slug shown for the item is unchanged

#### Scenario: Changed slug sent
- **WHEN** the admin changes the slug to a valid new value and saves
- **THEN** the update request contains the new slug

#### Scenario: Cleared slug blocked
- **WHEN** the admin clears the slug input of an existing item and saves
- **THEN** a slug-required error is shown on the field and no request is sent

### Requirement: Saved item slug reflects the value stored by the backend
After a successful update the frontend SHALL treat the slug in the response as the source of truth. When a slug was sent and the response slug differs from it, the frontend SHALL show a notice stating the final slug instead of the plain success message. An update conflict on the item slug SHALL NOT open a confirmation dialog because the backend resolves it automatically.

#### Scenario: Backend resolves a collision on update
- **WHEN** the admin saves the slug `beginner` that another tag owns and the backend responds `200` with slug `beginner-x7k92ab`
- **THEN** a notice states that the slug was changed to `beginner-x7k92ab` because it was taken

#### Scenario: Slug stored as sent
- **WHEN** the response slug equals the slug that was sent
- **THEN** the normal success message is shown

### Requirement: Tree nodes show and edit their own slug
Each node in the topic `child_topics` tree and the skill `children` tree SHALL display its persisted slug as secondary text and SHALL offer an edit control that reveals an inline slug input. A node that has no persisted slug yet (newly added in this dialog) SHALL show a placeholder indicating that the slug is generated from the name. Editing a node's slug SHALL NOT change that node's name, and changing a node's name SHALL NOT change that node's slug in the form. Nodes SHALL remain reorderable, addable, and removable as before.

#### Scenario: Existing node shows persisted slug
- **WHEN** the admin opens a topic whose node has slug `basics`
- **THEN** the node shows `basics` and an edit control

#### Scenario: New node shows the auto-generated placeholder
- **WHEN** the admin adds a new child node and types its name
- **THEN** the node shows the auto-generated placeholder and no slug value

#### Scenario: Inline edit
- **WHEN** the admin activates the edit control on a node and types `advanced-basics`
- **THEN** the node's slug input holds `advanced-basics` and the node's name is unchanged

### Requirement: Tree node slugs are sent only when the user supplied or changed them
The write payload for topics and skills SHALL include a node's `slug` only when the node is new and has a non-blank slug, or when the node already existed and its trimmed slug differs from the value loaded with the item. All other nodes SHALL omit `slug` so the backend preserves or generates it. The payload SHALL never contain an empty or whitespace-only slug for any node.

#### Scenario: Untouched existing node omits slug
- **WHEN** the admin renames the item and saves without editing any node slug
- **THEN** no node in the request carries a `slug`

#### Scenario: New node with typed slug
- **WHEN** the admin adds a node and types the slug `intro`
- **THEN** that node's `slug` is `intro` in the request and every other untouched node omits `slug`

#### Scenario: Node moved or renamed keeps slug omitted
- **WHEN** the admin reorders an existing node or edits its name without editing its slug
- **THEN** the node's `slug` is omitted in the request

### Requirement: Invalid tree node slugs are blocked before submit
Before a topic or skill is submitted the frontend SHALL validate every node slug: an existing node whose slug was cleared, and any node whose non-empty slug does not match the slug format, SHALL block the submit and show a visible error attached to that node. The frontend SHALL NOT send a request that the backend would reject with `400` for a blank node slug.

#### Scenario: Cleared slug on an existing node
- **WHEN** the admin clears the slug of an existing node and saves
- **THEN** an error is shown on that node and no request is sent

#### Scenario: Invalid slug on a new node
- **WHEN** the admin enters a slug ending in `-` on a new node and saves
- **THEN** a format error is shown on that node and no request is sent

### Requirement: Adjusted tree node slugs are reported
After a successful topic or skill update the frontend SHALL compare the node slugs in the response with the node slugs that were sent. When at least one manually sent node slug differs from the stored one (the backend resolved an in-tree collision), the frontend SHALL show a notice that one or more node slugs were adjusted to stay unique within the tree. No conflict dialog SHALL be shown for node slugs.

#### Scenario: Two nodes collide
- **WHEN** the admin saves two nodes with the same manual slug and the response stores one of them with a suffix
- **THEN** the save succeeds and a notice states that node slugs were adjusted

#### Scenario: No adjustment
- **WHEN** every sent node slug equals the stored one
- **THEN** only the normal success message is shown

### Requirement: Taxonomy slug messages are localized
Every user-visible string introduced for taxonomy slugs (hints, placeholders, validation errors, conflict dialog, adjusted-slug notices, node edit control labels) SHALL exist in English and Vietnamese. Error code `3007` SHALL continue to map to a localized message so it never falls back to the unknown-error message.

#### Scenario: Vietnamese locale
- **WHEN** the admin uses the Vietnamese locale and a create conflict occurs
- **THEN** the confirmation dialog and its buttons are shown in Vietnamese

#### Scenario: Code 3007 without a recommendation
- **WHEN** an API error with code `3007` and no usable recommendation occurs during a taxonomy create
- **THEN** the standard API-error toast shows the localized slug-already-exists message
