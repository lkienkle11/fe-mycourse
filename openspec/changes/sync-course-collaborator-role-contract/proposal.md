## Why

The backend Course role-gate cutover retains the collaborator HTTP response shape but now accepts only `EDITOR` in the optional bulk-add `role` field. The frontend already sends `EDITOR`, yet its request type still permits `OWNER`, so a TypeScript-valid caller can make a request the backend rejects.

## What Changes

- Restrict `AddCollaboratorsBulkPayload.role` to the optional literal `"EDITOR"`, matching the backend request contract and the existing collaborator picker submission.
- Preserve the `OWNER`/`EDITOR` response role type and the current display labels, API paths, payload handling, and permission gates.
- Update `docs/api-using.md`, `docs/reusable-assets.md`, and `docs/modules.md` to describe the accepted request role separately from response roles; review related UI/API descriptions for drift.
- Record the dynamic-UI boundary: the backend's internal role-action mapping is not projected in Course responses, so this change does not infer per-course allowed actions from role names or add a client-side action map.

## Capabilities

### New Capabilities

- `course-collaborator-request-contract`: Frontend bulk-add requests represent only the role accepted by the backend while preserving the broader response role contract.

### Modified Capabilities

None.

## Impact

- **Types:** `src/types/course.ts` narrows only the optional bulk-add request role field; response types continue to represent `OWNER` and `EDITOR`.
- **Callers and UI:** The existing `useCourseCollaboratorActions` submission already sends `EDITOR`; no endpoint, fetch, state, rendering, or permission behavior changes.
- **Documentation:** `docs/api-using.md`, `docs/reusable-assets.md`, and `docs/modules.md` are synchronized with the backend request contract; related UI/API descriptions are checked for drift.
- **Backend and dependencies:** No backend, schema, dependency, or migration change is requested here. A future action-driven UI requires a separate backend capability projection contract before FE implementation.
