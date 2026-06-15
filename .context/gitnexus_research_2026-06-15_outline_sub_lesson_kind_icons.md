# GitNexus research — outline sub-lesson kind icons

**Date:** 2026-06-15  
**Task:** Add icon left of type label (Video / Văn bản / Quiz) on outline sub-lesson rows.

## Phase 1 — Discovery

### Session context read
- Latest: `.context/session_summary_2026-06-15_estimated_duration.md` (outline tab duration labels recently added).

### Docs read
- `docs/router.md` — outline route: `/{locale}/instructor/courses/{courseId}/outline`
- `docs/folder-structure.md` — course features under `src/components/features/course/`
- `docs/pages.md` — `InstructorCourseEditorPage` tab=outline
- `docs/reusable-assets.md` — `CourseOutlineRowActions`, `course-editor-outline-tab.tsx`, duration helpers
- `docs/quality.md` — lint/biome/build/quality:deps gates

### Reusable assets to reuse
| Asset | Path | Use |
|-------|------|-----|
| `lucide-react` icons | `docs/dependencies.md` | Default icon lib for new UI |
| `Video`, `FileText` | `media-item-card.tsx` | Same glyphs for VIDEO/TEXT media kinds |
| `TAXONOMY_MENU_ICONS` pattern | `src/constants/dashboard/taxonomy-icons.ts` | Map kind → `LucideIcon` |
| i18n `course.common.subLessonKind.*` | `en.ts` / `vi.ts` | Label text (no new strings) |
| `CourseSubLessonKind` | `src/types/course.ts` | `VIDEO` \| `QUIZ` \| `TEXT` |

### Git audit
- Branch: `chore/phosphor-react-icons-deps` (clean working tree)
- No conflicting WIP

### GitNexus
- `query("course outline sub lesson kind type label")` → `course-editor-outline-tab.tsx`, `SectionOutlineCard`
- `context("SectionOutlineCard")` → renders sub-lesson type at L260-266 via `tCommon(subLessonKind.${kind})`
- `impact("SectionOutlineCard", upstream)` → **LOW**, 0 direct callers

### Current state
- Sub-lesson row shows plain text label only (no icon).
- Target line: `course-editor-outline-tab.tsx` L260-266 inside `SectionOutlineCard`.

### Phase 2 file plan
| Action | File |
|--------|------|
| CREATE | `src/constants/course/sub-lesson-kind-icons.ts` |
| CREATE | `src/components/features/course/sub-lesson-kind-label.tsx` |
| MODIFY | `src/components/features/course/course-editor-outline-tab.tsx` |
