# Session: Outline lease acquire UUID fix

## Problem
Clicking **Thêm section** on `/instructor/courses/6/outline` failed with API 2001:
`ResourceStableID` failed `uuid` validation.

Request body sent `resource_stable_id: "course-6-outline-root"`.

## Root cause
`rootOutlineStableId(courseId)` returned a human-readable string, but BE `leaseAcquireRequest.resource_stable_id` and DB column `course_edit_leases.resource_stable_id` require UUID.

## Fix
`src/lib/utils/course.ts` — `rootOutlineStableId` now returns deterministic RFC-4122 UUID:
`00000000-0000-4000-8000-{courseId hex padded to 12}`.

Example course 6: `00000000-0000-4000-8000-000000000006`.

## Verify
- `POST /api/v1/courses/6/leases/acquire` with new UUID → `code: 0`.
- FE quality: `lint:biome`, `lint`, `build`, `quality:deps` pass.

## Docs updated
- `docs/reusable-assets.md`
- `temporary-docs/chuc-nang-course-da-lam/fe-chuc-nang-course.md`
