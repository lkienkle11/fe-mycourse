## Context

See `proposal.md` for motivation and `specs/current-user-profile/spec.md` for the behavioral contract. The backend `MeResponse` now exposes a required, non-null `roles` JSON array and deliberately permits unknown role names after its known-role ordering. The frontend auth caller already returns the complete response through one shared `MeResponse` type and the auth store retains the whole profile object.

## Goals / Non-Goals

**Goals:**

- Make the shared frontend type accurately represent the backend `roles` field.
- Preserve the backend's array contents and order without adding client normalization.
- Keep the existing permission-based authorization boundary explicit in code documentation and project documentation.

**Non-Goals:**

- Add a role-based permission gate, role label mapping, or role-switch behavior.
- Change the auth transport, SWR key, Zustand state shape, endpoint, or backend.
- Add a frontend behavioral test framework or acceptance suite.
- Correct unrelated existing differences in other `MeResponse` fields.

## Decisions

### Use `string[]` on the shared `MeResponse`

Add `roles: string[]` beside `permissions` in `src/types/auth/auth.ts`. This directly mirrors the JSON array and remains forward-compatible with backend-defined role names.

Alternative considered: type the field as `RoleName[]` from the known `ROLES` constants. Rejected because the backend contract explicitly preserves unknown names, so a closed union would claim a narrower contract than the API provides.

### Pass roles through without a new adapter or store field

Keep `createAuthCallers` unchanged. Both GET and PATCH already deserialize into `MeResponse`, and existing SWR/Zustand flows retain the complete `me` object. A mapper or a parallel `meRoles` state value would duplicate data and introduce drift.

Alternative considered: normalize or reorder roles in the frontend caller. Rejected because ordering belongs to the backend contract and must not be reimplemented independently.

### Keep authorization permission-based

Do not change `use-permissions`, `PermissionGate`, navigation filters, or dashboard guards. Update current-state documentation to state that roles are display-only while `permissions` remains authoritative.

Alternative considered: use roles to select or unlock UI. Rejected because role presence does not prove the effective permissions required by a guarded action.

## Risks / Trade-offs

- [Risk] Existing fixtures or manually constructed `MeResponse` objects may omit the new required field → Run the repository TypeScript and full quality gates; update only in-scope compile-time fixtures if any are found.
- [Risk] Documentation may continue to claim `/me` has no roles → Search the current-state documentation for stale statements and synchronize each direct contract description.
- [Trade-off] `string[]` provides less autocomplete than a closed role union → It accurately models forward-compatible backend data; known constants remain available for display comparisons when explicitly needed later.

## Migration Plan

1. Update the current-state frontend documentation that describes `/me` and `ROLES` before changing source.
2. Add the required `roles: string[]` field to `MeResponse` without changing consumers.
3. Run formatting, type checking, dependency/architecture checks, and the full repository quality gate.
4. Verify the final diff and GitNexus affected scope, then validate the OpenSpec change strictly.

Rollback is a single contract-field and documentation revert. No data migration, deployment ordering, or backend rollback is required because the backend already emits the field.
