# Session Summary — Collaborator picker stale candidates fix (FE)

**Date:** 2026-06-25

## Bug

After adding collaborators (full success), reopening `CourseCollaboratorPickerDialog` still listed users already on the course (e.g. user04–06).

## Root cause

`UserMultiSelectPickerDialog` only called `onAfterPartialSuccess` (SWR `mutate` on candidates) when some picks failed. On **full success** the dialog closed without revalidating the instructor-candidates cache (`revalidateOnFocus: false`), so reopen served stale SWR data. BE `ListInstructorCandidates` already excludes existing collaborators.

## Fix

`user-multi-select-picker-dialog.tsx` — await `onAfterPartialSuccess?.()` before closing on full success (same hook as partial path via `UserMultiSelectPickerFeatureDialog` → `candidates.mutate()`).

## Quality gates

- `npm run check-all` — required after change
- `npx gitnexus analyze --embeddings` — sync after code changes

## Docs synced

- `docs/reusable-assets.md`
