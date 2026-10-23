## Context

See `proposal.md` for motivation and `specs/course-collaborator-request-contract/spec.md` for the contract. The backend bulk-add DTO accepts optional `role` with only `EDITOR`; its collaborator, course detail, and course list responses still expose `OWNER` or `EDITOR`. FE currently uses one `CourseCollaboratorRole` union for both response values and `AddCollaboratorsBulkPayload.role`, while `useCourseCollaboratorActions` already sends `EDITOR`.

## Goals / Non-Goals

**Goals:** Keep the TypeScript request boundary as narrow as the backend accepts, without losing owner display support or changing the existing request flow.

**Non-Goals:** Add role administration, change backend authorization, add per-course action projection, or replace current UI visibility checks with an invented frontend action map.

## Decisions

### Use a request-specific literal

Set `AddCollaboratorsBulkPayload.role` to `"EDITOR"` while leaving `CourseCollaboratorRole` unchanged for responses. A separate named type is unnecessary for a single literal field. Reusing the response union is the current source of drift; narrowing the shared union would incorrectly exclude `OWNER` from response data.

### Preserve current caller and UI behavior

The collaborator picker already sends `role: "EDITOR"`, so no caller adapter or new fetch path is needed. Current owner UI conditions continue to match the backend's present OWNER/EDITOR action sets. FE cannot infer redefined per-course actions from the existing `collaborator_role` response; action-based UI must wait for an explicit backend projection contract in a separate change.

## Risks / Trade-offs

- [Risk] Future backend roles could make the closed response union stale. → Revisit response typing when the backend HTTP contract adds roles; this change does not broaden an unchanged response contract speculatively.
- [Risk] Role-name UI visibility could diverge from future backend action-set changes. → Keep backend authorization authoritative and document the need for a per-course capability projection before changing FE visibility semantics.

## Migration Plan

Update `docs/api-using.md`, `docs/reusable-assets.md`, and `docs/modules.md`, review related API/UI descriptions for drift, narrow the request field, then run the FE quality gate and strict OpenSpec validation. No data migration or deployment ordering is required; rollback reverts the type and documentation change.
