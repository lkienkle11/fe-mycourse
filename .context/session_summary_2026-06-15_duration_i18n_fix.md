# Session summary — duration unit i18n fix (FE)

**Date:** 2026-06-15  
**Trigger:** Hardcoded `DURATION_UNITS` in `duration.ts` violated `tieu-chuan-check-be-fe` phase 2 rule “toàn bộ text lấy từ i18n”.

## GitNexus (phase 2)

- `gitnexus_impact({ target: "formatDurationMs", direction: "upstream" })` — **LOW**, d=1: `OutlineDurationLabel`, `SubLessonVideoFields` — both updated.

## Changes

| File | Change |
|------|--------|
| `src/messages/en.ts`, `vi.ts` | `course.common.durationUnitHours|Minutes|Seconds` |
| `src/lib/utils/duration.ts` | Removed `DurationLocale` + hardcoded map; `DurationUnits` + `buildDurationUnits(t)` |
| `course-editor-outline-tab.tsx` | `buildDurationUnits(tCommon)` |
| `course-editor-dialogs.tsx` | Same for VIDEO read-only hint |
| `docs/reusable-assets.md`, `modules.md`, `instructor-admin.md` | i18n note |

## Quality (phase 3)

- `npx biome check --write` — pass
- `pnpm build` — pass
