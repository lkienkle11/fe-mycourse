# Session: Basic info 2nd-save optimistic lock conflict (FE fix)

**Date:** 2026-06-23  
**Branch:** `feat/auth-refresh-bff-proxy` (FE, uncommitted)

## Bug

On `/instructor/courses/:id/info`, first **Lưu** succeeds; second save (same user, no concurrent editor) shows toast **"Thao tác xung đột với trạng thái hiện tại."** (`409` / app code `3005`).

## Debug method

Chrome DevTools MCP only (no curl):

1. Navigate to course info tab, click **Lưu** twice.
2. `list_network_requests` + `get_network_request` on `PATCH …/basic-info`.

**Before fix:**

| # | `expected_row_version` (request) | Response `row_version` | Status |
|---|----------------------------------|----------------------|--------|
| 1 | 3 | 4 | 200 |
| 2 | 3 (stale) | — | 409 |

**After fix:**

| # | `expected_row_version` | Response `row_version` | Status |
|---|------------------------|------------------------|--------|
| 1 | 5 | 6 | 200 |
| 2 | 6 | 7 | 200 |

## Root cause (FE)

`useCourseBasicInfoState` only re-synced form when `draft_version.id` changed, not when `row_version` incremented after save. `handleSaveBasicInfo` called `refreshDetail()` but `basicInfo.expected_row_version` stayed stale.

BE optimistic locking is correct — no BE change.

## Fix

`src/hooks/course/use-course-editor-state.ts`:

- `useCourseBasicInfoState`: sync on version **id** (full reset) or **row_version** change (update lock only).
- `handleSaveBasicInfo`: apply PATCH response to SWR via `mutateDetail(detail, { revalidate: false })`; set `expected_row_version` from `detail.draft_version.row_version`.

## Docs updated

- `docs/modules.md`
- `docs/api-overview.md`
- `docs/instructor-admin.md`
- `docs/logic-flow.md` (new §10 basic-info save; submit → §11; stream → §12; version → §13)

## QA

- Chrome DevTools MCP: consecutive saves → both `PATCH 200`
- `npm run test-all` — pass
- `npm run check-all` — (run at close-out)
