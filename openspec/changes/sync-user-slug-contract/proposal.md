## Why

The backend (`be-mycourse`, branch `feat/add-user-slug-management`) now stores a stable, human-readable **user slug** and emits it on every user-identity response: the current-user profile, course collaborators and candidates, the instructor roster and roster candidates, instructor applications and profiles, and the course list `owner_slug`. The frontend types, one Zod schema, the unit-test fixtures and the Playwright fixture server still describe the pre-slug contract, so the frontend cannot represent the full response and the documented API contract is stale. The same audit found two drifts on `MeResponse` itself: `avatar_url` is declared required although the backend omits it when nil, and `avatar_object_key` is missing.

This is the "Task A" prerequisite recorded in the Memory Bank: align the **existing** frontend types with the API first, so that the later Home wiring (Task B) and any user-slug UI build on an accurate contract.

## What Changes

- `MeResponse` (`GET` and `PATCH /api/v1/me`): add required `slug: string`; make `avatar_url` optional; add optional `avatar_object_key`.
- `UpdateMePayload` and `updateMeSchema` (`PATCH /api/v1/me` body): add optional `slug`. Omitting the key leaves the slug unchanged; the schema reuses the shared slug fields (`optionalSlugField`) so there is no second copy of the format rule.
- `CourseListItem`: add optional `owner_slug` (the backend marks it `omitempty`).
- `UserPickerCandidate`, `InstructorUserIdentity`, `InstructorRosterMember`, `MyInstructorApplication`: add required `slug: string`.
- `CourseCollaborator`: re-declare as `UserPickerCandidate & { role: CourseCollaboratorRole }` so the identity fields (now including `slug`) are declared once. Field set and optionality are otherwise identical, so this is a pure de-duplication.
- Test and fixture data: `buildMeResponse`, the collaborator/picker/application test builders, and the `e2e/fixtures/server.mjs` mock (not type-checked) gain `slug` and mirror the backend's omission of `avatar_url`.
- New tests: `src/schema/me/me.test.ts` (schema contract) and `src/lib/instructor-application/helpers.test.ts` (slug survives `mergeInstructorApplicationDetail`).
- Documentation is synchronised (English, replace-not-append) in `README.md` and eight `docs/*.md` files; the inventory lists every file, section and statement.
- Explicitly **not** changed: no endpoint, transport, SWR key, store, hook, component or route; no UI that shows or edits a user slug; no slug-conflict flow (`useSlugConflictFlow` is create-only and `PATCH /me` never returns 409); no Home types (Task B); no backend or database change.
- No **BREAKING** change at runtime. The changes are additive; making `slug` required is a compile-time-only tightening that the type-checker enforces on the four test builders and one e2e fixture listed in the inventory.

## Capabilities

### New Capabilities

- `user-slug-contract`: Defines how the frontend represents the backend user-slug contract (`slug` on the current-user profile and on user-identity rows, `owner_slug` on course list items, the optional `slug` in the current-user update body, the optional avatar fields of the profile) and the rules for consuming it (empty means unassigned, never an identity key, no conflict flow).

### Modified Capabilities

None. The unarchived change `sync-me-roles-contract` introduces a separate `current-user-profile` delta; this change deliberately uses a different capability path so the two deltas never collide when archived.

## Impact

- **Types:** `src/types/auth/auth.ts`, `src/types/course.ts`, `src/types/user-picker.ts`, `src/types/instructor.ts`, `src/api/callers/auth/auth-factory.ts` (`UpdateMePayload`).
- **Schema:** `src/schema/me/me.ts` (reuses `src/schema/shared/slug.ts`).
- **Tests and fixtures:** `src/test-support/fixtures/auth.ts`, three colocated test builders, `e2e/fixtures/server.mjs`, two new test files.
- **Documentation:** `README.md`, `docs/api-overview.md`, `docs/api-using.md`, `docs/modules.md`, `docs/folder-structure.md`, `docs/reusable-assets.md`, `docs/testing.md`, `docs/instructor-admin.md`, `docs/instructor-application.md`.
- **Consumers:** every other file that references the changed types is pass-through or reads unrelated fields and needs no change (enumerated in `code-change-inventory.md` §4). Runtime behaviour is identical.
- **Backend / dependencies:** none. Observation for the backend owners (not part of this change): `GET`/`PATCH /me` never populate `avatar_url` or `avatar_object_key` (`buildMeProfile` sets only `AvatarFileID`), `docs/api_swagger.yaml` `MeProfile` drifts from the Go `MeResponse`, and `be-mycourse/docs/api-overview.md` still describes a nested `avatar`. Because the frontend now declares both avatar fields optional, it is correct either way.
