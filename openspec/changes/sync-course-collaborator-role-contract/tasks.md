## 1. Confirm Scope and Dependencies

- [x] 1.1 Re-read the backend bulk-add DTO and collaborator response contract, the FE `CourseCollaboratorRole` and `AddCollaboratorsBulkPayload` types, and the caller submission; verify the backend still accepts only optional `EDITOR` and the FE still sends it.
- [x] 1.2 Validate the stable session ID and exact FE session context, inspect `git status --short` for pre-existing changes, and verify unrelated work can be preserved.
- [x] 1.3 Refresh GitNexus if stale and run upstream impact analysis for `AddCollaboratorsBulkPayload` before editing it; report direct callers, affected flows, and risk, and warn the user before edits if the result is HIGH or CRITICAL.

## 2. Align the Frontend Contract

- [x] 2.1 Update `docs/api-using.md` (Course collaborators table) to state that bulk-add `role` is optional, accepts only `EDITOR`, and defaults to `EDITOR`; verify its response description still distinguishes returned `OWNER`/`EDITOR` roles from assignable request roles.
- [x] 2.2 Update `docs/reusable-assets.md` (course collaborators tab + picker + hooks asset) to record that `useCourseCollaboratorActions` submits `EDITOR` and the request type excludes `OWNER`; verify the existing owner-only UI description remains accurate.
- [x] 2.3 Update `docs/modules.md` (Course types inventory) to distinguish `AddCollaboratorsBulkPayload.role` from `CourseCollaboratorRole` in responses; verify the documented type ownership matches `src/types/course.ts`.
- [x] 2.4 Review `docs/api-overview.md`, `docs/logic-flow.md`, and `docs/instructor-admin.md` for any statement that bulk-add can assign `OWNER`; update only inaccurate statements and verify the remaining owner/EDITOR UI descriptions still reflect current behavior.
- [x] 2.5 Narrow only `AddCollaboratorsBulkPayload.role` to optional `"EDITOR"` in `src/types/course.ts`; verify `CourseCollaboratorRole`, `CourseCollaborator`, `CourseDetail`, and `CourseListItem` still represent response `OWNER` and `EDITOR`.
- [x] 2.6 Verify `useCourseCollaboratorActions` still sends `EDITOR` and no new endpoint, fetch path, role-action mapping, or UI gate is introduced by the diff.

## 3. Verify and Hand Off

- [x] 3.1 Run `npm run check-all` without bypassing any configured gate; verify the complete FE lint, formatting, type, dependency, and build workflow passes.
- [x] 3.2 Run `git diff --check`, inspect the complete changed surface, and run GitNexus change detection; verify only the expected contract and documentation scope changed and no source execution flow changed unexpectedly.
- [x] 3.3 Run `openspec validate sync-course-collaborator-role-contract --strict --no-interactive` and inspect OpenSpec status; verify the artifacts and implemented checklist are consistent.
- [x] 3.4 Update the exact current session context with the final files, checks, outcomes, and remaining action-projection limitation; verify no second session context file was created and do not commit unless requested.
