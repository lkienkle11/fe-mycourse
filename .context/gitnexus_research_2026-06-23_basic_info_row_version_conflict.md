# GitNexus Research — Basic Info 2nd Save Conflict (FE)

**Date:** 2026-06-23  
**Task:** Lưu basic info lần 2 báo "Thao tác xung đột" (3005) dù chỉ 1 người edit.

## Root cause (code analysis)

- BE `UpdateBasicInfo` increments `row_version` on each PATCH (`buildBasicInfoUpdates`).
- FE `useCourseBasicInfoState` chỉ re-sync form khi `activeVersion.id` đổi — **không** khi `row_version` tăng sau save.
- `handleSaveBasicInfo` gọi `refreshDetail()` nhưng `basicInfo.expected_row_version` vẫn giữ giá trị cũ → lần save 2 gửi stale lock → BE 409/3005.

## GitNexus impact (pre-fix)

| Symbol | Risk | d=1 |
|--------|------|-----|
| `useCourseBasicInfoState` | LOW | `useCourseEditorState` |
| `handleSaveBasicInfo` | LOW | `InstructorCourseEditorPage` |

## Planned fix (FE only)

1. Sync `basicInfo` khi `activeVersion.id` **hoặc** `activeVersion.row_version` thay đổi.
2. Sau save thành công: cập nhật `expected_row_version` từ API response (defense in depth).

## Docs gap

- `docs/logic-flow.md`, `docs/instructor-admin.md`, `docs/reusable-assets.md` — ghi rõ FE phải refresh `expected_row_version` sau mỗi lần save basic info.
