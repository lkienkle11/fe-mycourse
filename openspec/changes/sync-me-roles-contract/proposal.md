## Why

The backend now returns a non-null `roles` array from `GET /api/v1/me`, but the frontend `MeResponse` contract and current-state documentation still omit that field. This mismatch prevents frontend code from representing the complete response safely and leaves the documented API contract stale.

## What Changes

- Add a required `roles: string[]` field to the shared frontend `MeResponse` type used by `GET /api/v1/me` and `PATCH /api/v1/me`.
- Preserve backend semantics: the array may be empty, known roles arrive in backend-defined order, and unknown role names remain representable.
- Keep `permissions` authoritative for access control; the new role projection is display-only and must not replace permission gates.
- Synchronize frontend documentation that currently says `/me` does not return roles.
- Do not add or change endpoints, transport behavior, auth-store state, role mappings, or user-interface behavior.

## Capabilities

### New Capabilities

- `current-user-profile`: Defines the frontend contract for consuming the backend current-user profile, including its display-only role-name array and authorization boundary.

### Modified Capabilities

None.

## Impact

- **Types:** `src/types/auth/auth.ts` gains the backend-provided `roles` field on `MeResponse`.
- **API consumers:** Existing auth callers and SWR/store consumers receive the field through the shared type without a new request path or data transform.
- **Documentation:** Current-state auth, module, and reusable-asset documentation must match the backend contract.
- **Authorization:** No policy change; all frontend gates continue to use `permissions`.
- **Dependencies and backend:** No dependency, endpoint, or backend change.
