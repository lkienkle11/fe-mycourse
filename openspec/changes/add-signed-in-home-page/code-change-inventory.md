# Code Change Inventory

Companion to `design.md` (which summarises each item per file); this file carries the exact CURRENT code, the exact AFTER code, call sites, the reused resource that justifies creating nothing new, tests, and the documentation item IDs from `docs-update-inventory.md`. Frontend only (`fe-mycourse`); do not touch `be-mycourse`. Line numbers are `HEAD af62c40` and must be re-located by symbol or quote at implementation time. **ADD** = new, **MODIFY** = replace, **DELETE** = remove.

GitNexus note: the index is two commits behind (`5a40767`) and returned `UNKNOWN` risk with zero callers for every probed symbol; constants are not indexed. The caller and consumer lists come from `grep`/`Read`. Task 6 re-runs `npx gitnexus analyze`, then `impact` per edited symbol, and records the result before the first edit; HIGH or CRITICAL results must be reported to the user first.

## 0. Capability audit verdicts that drive this inventory

| ID | Capability | Verdict | Shared module (owner / name) |
|---|---|---|---|
| CAP-1 | User picture or coloured initials in a circle | MERGE (5 existing copies + the new instructor card) | `src/components/shared/user-avatar.tsx` → `UserAvatar` |
| CAP-2 | Section title + muted description | MERGE (left-aligned shape) | `src/components/shared/section-header.tsx` → `SectionHeader` |
| CAP-3 | Remote course thumbnail with placeholder | NEW shared | `src/components/shared/course-thumbnail.tsx` → `CourseThumbnail` |
| CAP-4 | Section loading / empty / error / content | NEW shared in the feature | `src/components/home/signed-in/home-section-shell.tsx` → `HomeSectionShell` |
| CAP-5 | Owner fields + common course-card fields | MERGE (compose types) | `src/types/course.ts` → `CourseOwnerSummary`, `CourseCardBase` |
| CAP-6 | Course catalogue callers | EXTEND the existing slice | `course-factory-review.ts`, `course-keys.ts`, `course-browser.ts` |
| CAP-7 | "Initial limit, then once expand to the maximum" state | NEW shared (used by two sections) | `src/hooks/home/use-expand-more.ts` → `useExpandMore` |

New sibling-feature import edges: **none**. Non-shared duplicates intentionally kept: see `design.md` "Examined and kept separate".

## 1. Reuse ledger (resources reused as-is, never re-implemented)

| Resource | Path | Used for |
|---|---|---|
| `createApiMethods` / `apiFetch` | `src/api/core/methods.ts`, `src/api/transport/browser-api-methods.ts` | transport for all three endpoints |
| `useApiRowsQuery` | `src/api/hooks/shared.ts:53` | the three hooks |
| `buildQueryParams` | `src/lib/utils/url.ts:25` (re-exported from `@/lib/utils`) | `?limit=` in keys |
| `ApiResponse<T>` | `src/types/api.ts:30` | envelope in callers |
| `DEFAULT_SWR_CONFIG` | `src/constants/swr.ts` | no per-hook override |
| `useGetMe`, `useHasPermission`, `PERMISSIONS.CourseRead` | `src/hooks/auth/*`, `src/constants/permissions.ts:9` | gate |
| `loginHref`, `signedInHomeHref`, `toPublicResourceRoute` | `src/lib/navigation/routes.ts` | CTA, `courseDetailHref` |
| `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` | `src/components/ui/carousel.tsx` | hero |
| `Card*`, `Skeleton`, `Progress`, `Empty*`, `Button`, `AspectRatio` | `src/components/ui/*` | cards and states |
| `pickCharacter` | `src/lib/utils/user.ts:7` | inside `UserAvatar` |
| `IMAGE_SIZES_COURSE_CARD` (existing), `IMAGE_SIZES_HERO_TILE`, `IMAGE_SIZES_HERO_PHOTO` (new) | `src/constants/seo/image.ts` | `sizes` |
| `robotsPreset`, `robotsModeForPublicRouteKey` pattern | `src/lib/seo/robots-presets.ts`, `login/page.tsx` | placeholder metadata (the existing no-index preset is read first) |
| `Link` | `src/i18n/navigation.ts` | locale-aware links |
| `renderWithProviders`, MSW `server`, `buildMeResponse` | `src/test-support/*` | tests |
| `json`, `envelope`, `USERS`, `resetState` | `e2e/fixtures/server.mjs` | fixture endpoints |

## 2. Edits per file

### A1/A2. `src/constants/api-route.ts` (MODIFY)

CURRENT (lines 2-15, `API_PUBLIC_ROUTES`):

```ts
export const API_PUBLIC_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    ...
    discord: "/api/v1/auth/discord",
  },
} as const;
```

AFTER (insert `catalog` after `auth`):

```ts
  catalog: {
    trendingCourses: "/api/v1/catalog/courses/trending",
    popularInstructors: "/api/v1/catalog/instructors/popular",
  },
```

CURRENT (`API_PRIVATE_ROUTES.course`, lines 90-93): `learnerCollection`, `learnerById`, `learnerEnroll`, `learnerProgress`.

AFTER (insert after `learnerProgress`):

```ts
    continueLearning: "/api/v1/learner-courses/continue",
```

Call sites: `API_PRIVATE_ROUTES` has 15 importers (`app/api/auth/refresh/route.ts`, `api/auth/server-auth.ts`, `api/transport/api-transport.ts`, the course, instructor, auth, taxonomy and media callers); adding keys is additive. Before editing, read `api-transport.ts` and `server-auth.ts` to confirm they do not enumerate or classify routes by iterating these objects (`Object.values`); if one does, adjust the plan before editing. Docs: DOC-3, DOC-9, DOC-34, DOC-47. Verify: `npx tsc --noEmit`.

### A3. `src/constants/home.ts` (ADD, values only; `src/constants/**` allows values only)

```ts
/**
 * Signed-in home list limits. Maxima mirror the backend clamps
 * (trending 24, continue learning 10, popular instructors 12).
 *
 * Expand More currently only extends the list in place on the signed-in home page;
 * the original product intent was to navigate to a course detail/list page.
 * If a course detail/list page is ever implemented, ask the user with AskUserQuestion
 * whether Expand More should change from in-page expansion to navigation before
 * changing this behaviour.
 */
export const HOME_TRENDING_INITIAL_LIMIT = 8;
export const HOME_TRENDING_MAX_LIMIT = 24;
export const HOME_CONTINUE_INITIAL_LIMIT = 3;
export const HOME_CONTINUE_MAX_LIMIT = 10;
export const HOME_POPULAR_INSTRUCTORS_LIMIT = 4;
export const HOME_POPULAR_INSTRUCTORS_MAX_LIMIT = 12;
```

Reuse check: `grep -rn "limit" src/constants` first; no existing home constant exists. Export through `src/constants/index.ts` only if that barrel re-exports siblings (read it first). Docs: DOC-12. Verify: `npx tsc --noEmit`.

### A4. `src/types/course.ts` (ADD, type-only)

Insert after `CourseListItem`:

```ts
/** Owner fields shared by every course-card shape the API returns. */
export type CourseOwnerSummary = {
  owner_display_name?: string;
  /** Owner user slug; omitted by the backend when empty. Test for falsiness, never compare to "". */
  owner_slug?: string;
};

/** Fields common to the home course cards (trending and continue learning). */
export type CourseCardBase = CourseOwnerSummary & {
  slug: string;
  title: string;
  thumbnail_url?: string;
};

/** `GET /api/v1/catalog/courses/trending` item (published-only projection; no price, rating or badge). */
export type TrendingCourseItem = CourseCardBase & {
  id: string;
  short_description: string;
  created_at: number;
};

/** `GET /api/v1/learner-courses/continue` item; the counts include every sub-lesson kind. */
export type ContinueLearningItem = CourseCardBase & {
  course_id: string;
  completed_sub_lessons: number;
  total_sub_lessons: number;
  progress_percent: number;
  last_activity_at: number;
};
```

`CourseListItem` is **not** modified (its own `owner_display_name?` / `owner_slug?` lines stay; it is the instructor/admin list shape with many other fields; recorded in the audit). Reuse check: `grep -rn "owner_slug" src/types` to confirm the only existing declaration is `CourseListItem`. `src/types/index.ts` already `export type * from "./course"`. Docs: DOC-49. Verify: `npx tsc --noEmit`.

### A5. `src/types/instructor.ts` (ADD, type-only)

```ts
/** `GET /api/v1/catalog/instructors/popular` item. The picture key is `avatar` (not `avatar_url`). */
export type PopularInstructorItem = {
  user_id: string;
  display_name: string;
  /** User slug; `""` until the backend assigns one. Never an identity key. */
  slug: string;
  avatar?: string;
  subtitle?: string;
  course_count: number;
};
```

Reuse check: not merged with `UserPickerCandidate` / `InstructorUserIdentity` / `InstructorRosterMember` (different wire keys and optionality; see audit). `src/types/index.ts` does not export `instructor`; import from `@/types/instructor` as other callers do. Docs: DOC-49.

### A6. `src/api/callers/course/course-keys.ts` (ADD)

```ts
export function getTrendingCoursesKey(limit?: number): string | null {
  return buildQueryParams(
    API_PUBLIC_ROUTES.catalog.trendingCourses,
    limit == null ? undefined : { limit: String(limit) },
  );
}

export function getContinueLearningKey(limit?: number): string | null {
  return buildQueryParams(
    routes.continueLearning,
    limit == null ? undefined : { limit: String(limit) },
  );
}
```

plus `import { API_PRIVATE_ROUTES, API_PUBLIC_ROUTES } from "@/constants/api-route";` (the existing import line is widened, not duplicated). Reuse check: the `get*Key` + `buildQueryParams` pattern of `getCourseCollaboratorsKey`; `buildQueryParams` returns `string | null`, so keys are typed accordingly (read its signature at implementation and align the second argument). Tests: `course-keys.test.ts` (A6 tests). Docs: DOC-6, DOC-10.

### A7. `src/api/callers/course/course-factory-review.ts` (MODIFY `createCourseReviewCallers`)

Add inside the factory, next to `listPublishedCoursesService`:

```ts
  async function listTrendingCoursesService(
    limit?: number,
  ): Promise<TrendingCourseItem[]> {
    const url = requireUrl(getTrendingCoursesKey(limit), "trending courses url");
    const { data } = await methods.apiFetch<ApiResponse<TrendingCourseItem[]>>(url);
    return data.data ?? [];
  }

  async function listContinueLearningService(
    limit?: number,
  ): Promise<ContinueLearningItem[]> {
    const url = requireUrl(getContinueLearningKey(limit), "continue learning url");
    const { data } = await methods.apiFetch<ApiResponse<ContinueLearningItem[]>>(url);
    return data.data ?? [];
  }
```

and add both names to the returned object of `createCourseReviewCallers`; extend the imports from `./course-keys` (`getContinueLearningKey`, `getTrendingCoursesKey`) and from `@/types/course` (`ContinueLearningItem`, `TrendingCourseItem`). Reuse check: the body mirrors `listPublishedCoursesService` (`:164-169`); the file is about 425 lines, under the 700-line limit; if `npm run dupl` flags the two near-identical list functions, extract a file-private `fetchList<T>(url)` helper used by `listPublishedCoursesService` too (decided at the gate, not before). Consumers (no edit): `createCourseCallers` spread (`course-factory.ts`). Tests: `course-factory-review.test.ts` (MSW). Docs: DOC-6, DOC-10.

### A8. `src/api/callers/course/course-browser.ts` (ADD two re-exports, after `getCourseProgressService`)

```ts
export const listTrendingCoursesService =
  browserCourseCallers.listTrendingCoursesService;
export const listContinueLearningService =
  browserCourseCallers.listContinueLearningService;
```

`course/index.ts` already `export *`s the browser file and `course-keys` (verify the barrel re-exports `get*Key` helpers before importing them in hooks; `useCourses.ts` already imports `getAdminCoursesKey` from `@/api/callers/course`).

### A9-A12. Instructor catalog caller slice

`instructor-factory-keys.ts` (ADD):

```ts
export function getPopularInstructorsKey(limit?: number): string | null {
  return buildQueryParams(
    API_PUBLIC_ROUTES.catalog.popularInstructors,
    limit == null ? undefined : { limit: String(limit) },
  );
}
```

(widen the existing `@/constants/api-route` import). New file `src/api/callers/instructor/instructor-factory-catalog.ts`:

```ts
/**
 * Instructor catalog callers (isomorphic factory slice): public popular-instructors list.
 */

import type { ApiMethods } from "@/api/core/methods";
import type { ApiResponse } from "@/types/api";
import type { PopularInstructorItem } from "@/types/instructor";
import { getPopularInstructorsKey } from "./instructor-factory-keys";

export function createInstructorCatalogCallers(methods: ApiMethods) {
  async function listPopularInstructorsService(
    limit?: number,
  ): Promise<PopularInstructorItem[]> {
    const url = getPopularInstructorsKey(limit);
    if (!url) {
      throw new Error("popular instructors url is required");
    }
    const { data } =
      await methods.apiFetch<ApiResponse<PopularInstructorItem[]>>(url);
    return data.data ?? [];
  }

  return { listPopularInstructorsService };
}
```

(if `requireUrl` is exported from a neutral module reachable without importing the course domain, use it instead; `requireUrl` currently lives in `course-keys.ts`, importing it from the instructor domain would create a cross-domain edge, so the instructor slice keeps the three-line guard and the audit records why). `instructor-factory.ts`: add `import { createInstructorCatalogCallers } from "./instructor-factory-catalog";`, add `getPopularInstructorsKey` to the key re-export block, add `...createInstructorCatalogCallers(methods),` to the returned object. `instructor-browser.ts`: ADD

```ts
export const listPopularInstructorsService =
  browserInstructorCallers.listPopularInstructorsService;
```

`index.ts` already re-exports both modules. Tests: `instructor-factory-catalog.test.ts`. Docs: DOC-6, DOC-10, DOC-39.

### A13. `src/api/hooks/course/useCourses.ts` (ADD two hooks; extend imports)

```ts
export function useTrendingCourses(limit: number) {
  return useApiRowsQuery<TrendingCourseItem>(
    getTrendingCoursesKey(limit),
    () => listTrendingCoursesService(limit),
  );
}

/** `enabled` must be true only for a signed-in user holding `course:read`; a `null` key disables the fetch. */
export function useContinueLearning(limit: number, enabled: boolean) {
  return useApiRowsQuery<ContinueLearningItem>(
    enabled ? getContinueLearningKey(limit) : null,
    () => listContinueLearningService(limit),
  );
}
```

No per-hook SWR option (the application defaults apply; the existing hooks' `revalidateOnFocus: true` is not copied because the global default is `false`). Tests: `useCourses.test.tsx` additions or a new `useHomeCourses.test.tsx` beside `shared.test.tsx`. Docs: DOC-10.

### A14. `src/api/hooks/instructor/useInstructorCatalog.ts` (ADD) + `index.ts` (ADD `export * from "./useInstructorCatalog";`)

```ts
"use client";

import {
  getPopularInstructorsKey,
  listPopularInstructorsService,
} from "@/api/callers/instructor";
import { useApiRowsQuery } from "@/api/hooks/shared";
import type { PopularInstructorItem } from "@/types/instructor";

export function usePopularInstructors(limit: number) {
  return useApiRowsQuery<PopularInstructorItem>(
    getPopularInstructorsKey(limit),
    () => listPopularInstructorsService(limit),
  );
}
```

Note: `src/api/hooks/index.ts` exports only `auth` and `course`; instructor hooks are imported from `@/api/hooks/instructor` by their consumers, so the new hook follows that import path and `index.ts` of the root hooks barrel is not edited.

### CAP-7. `src/hooks/home/use-expand-more.ts` (ADD) and `src/hooks/index.ts` check

```ts
"use client";

import { useCallback, useState } from "react";

type UseExpandMoreOptions = { initialLimit: number; maxLimit: number };

/**
 * Initial list limit that can be raised once to the endpoint maximum.
 *
 * Expand More currently only extends the list in place on the signed-in home page;
 * the original product intent was to navigate to a course detail/list page.
 * If a course detail/list page is ever implemented, ask the user with AskUserQuestion
 * whether Expand More should change from in-page expansion to navigation before
 * changing this behaviour.
 */
export function useExpandMore({ initialLimit, maxLimit }: UseExpandMoreOptions) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expand = useCallback(() => setIsExpanded(true), []);
  return {
    limit: isExpanded ? maxLimit : initialLimit,
    isExpanded,
    expand,
  };
}
```

Reuse check: no existing "expand" or "limit" state hook (`grep -rn "useState.*limit\|useExpand" src`). If `src/hooks/index.ts` aggregates domain barrels, add `./home` there only if siblings are exported that way (read first). Tests: `use-expand-more.test.tsx`.

### R1. `src/constants/route.ts` (MODIFY)

CURRENT: `export const PUBLIC_RESOURCE_ROUTES = {} as const;` and the comment `/** Signed-in homepage (temporary placeholder UI until Figma home ships). */` above `home: "/home"`.

AFTER:

```ts
export const PUBLIC_RESOURCE_ROUTES = {
  /** Course detail page (temporary placeholder until the real page is built). */
  course: "/courses/:slug",
} as const;
```

and the comment becomes `/** Signed-in homepage (hero, Complete your Course, Trending Course, Popular Instructor). */`. Call sites: `PublicResourceRoutes` type and `publicResourceRoutes` alias in `routes.ts`. Before editing, read `src/lib/seo/**` and `src/lib/security/web/crawl-policy.ts` to confirm nothing iterates `PUBLIC_RESOURCE_ROUTES` into the sitemap or the disallow list (design D9); record the evidence. Docs: DOC-4, DOC-16, DOC-33, DOC-48.

### R2. `src/lib/navigation/routes.ts` (ADD)

```ts
export function courseDetailHref(slug: string): string {
  return toPublicResourceRoute(publicResourceRoutes.course, { slug });
}
```

(mirrors `instructorCourseEditorHref`, `:65`; reuse the file's existing `publicResourceRoutes` alias; read it first). Tests: add cases to `routes.test.ts`. Docs: DOC-24, DOC-48.

### R3/R4. Placeholder page

`src/app/[locale]/(web)/courses/[slug]/page.tsx` (ADD; read `src/app/[locale]/instructor/courses/[courseId]/*/page.tsx` for the exact `params: Promise<...>` signature in this Next version):

```tsx
import { CourseDetailPlaceholderPage } from "@/screen";
// generateMetadata: title from the `home.signedIn.coursePlaceholder.title` key via getTranslations, robots no-index preset (read robots-presets.ts and reuse the existing no-index mode).
export default async function CourseDetailRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CourseDetailPlaceholderPage slug={slug} />;
}
```

`src/screen/common/course/course-detail-placeholder-page.tsx` (ADD; ESLint requires `*-page.tsx`): server component using `getTranslations("home.signedIn.coursePlaceholder")`, `Link` + `Button asChild` back to `signedInHomeHref`; shows the slug is **not** rendered as trusted HTML (plain text only, or omitted). `src/screen/common/index.ts` ADD `export * from "./course/course-detail-placeholder-page";` (read the barrel first: it currently has `home/page`, `home/signed-in-home-page`, `instructor`, `not-found`, `taxonomy`, no `course` line; confirm admin course pages are exported elsewhere, and avoid a `@/screen` ↔ `@/components` cycle). Docs: DOC-15, DOC-20, DOC-21, DOC-26.

### U1. `src/components/shared/user-avatar.tsx` (ADD) and the five migrations

Before writing, **read all five files in full** and record, per file, what differs (size classes, `alt`, `priority`, rounded shape, text size, whether `next/image` or `<img>` is used, the fallback colours source). The component API is derived from the intersection, for example:

```tsx
type UserAvatarProps = {
  name: string;
  src?: string | null;
  alt?: string;
  /** Tailwind size classes for the circle, e.g. "size-10". */
  className?: string;
  /** Pixel size passed to next/image width/height. */
  size: number;
  /** Set unoptimized for remote API images (repository precedent). */
  unoptimized?: boolean;
};
```

Behaviour: when `src` is truthy render `next/image` (`rounded-full object-cover`), otherwise a circle with the `pickCharacter(name)` background and initial label colour. Migrate a call site only if after migration its rendered DOM class list and fallback are unchanged; otherwise keep it and write the exact difference into this file under "U2 kept separate". Call sites: `src/components/common/auth-menu/user-menu.tsx:18-48` (renders `me.avatar_url`), `src/components/common/header/sidebar-auth-footer.tsx:43-60`, `src/components/features/instructor/instructor-user-cell.tsx:31-57`, `src/screen/common/instructor/instructor-roster-page.tsx:145-170`, `src/components/features/instructor/instructor-profile-view-dialog.tsx:76-125`. Existing tests that cover them (`dashboard-layout.test.tsx`, instructor tests) must pass unchanged; add `user-avatar.test.tsx` (image branch, initials branch, name with Vietnamese diacritics, empty name). Docs: DOC-44, DOC-49.

### U3. `src/components/shared/section-header.tsx` (ADD) and guest-section migration

```tsx
type SectionHeaderProps = { title: string; description?: string; className?: string };
// Left-aligned: <header className={cn("space-y-1", className)}><h2 …>{title}</h2>{description && <p …>{description}</p>}</header>
```

Exact classes are copied from the identical markup of `top-courses-section.tsx:75-90` and `trending-courses-section.tsx:63-77` after reading them in full (task 7.4). Migrate those two (and `upcoming-webinars-section.tsx` / `advanced-promo-section.tsx` only if their markup is the same left-aligned shape without a differing wrapper); sections with a "view all" button keep the button outside the shared header. Record each decision. Tests: `section-header.test.tsx`. Docs: DOC-44.

### U5. `src/components/shared/course-thumbnail.tsx` (ADD)

```tsx
type CourseThumbnailProps = { src?: string; alt: string; className?: string };
// aspect-video wrapper (ui/aspect-ratio or the existing aspect class), next/image fill unoptimized + sizes={IMAGE_SIZES_COURSE_CARD} when src; Empty/icon placeholder otherwise, modelled on media-item-card.tsx:113-139.
```

Tests: `course-thumbnail.test.tsx`. Docs: DOC-44.

### H1. `src/components/home/signed-in/*` (ADD)

| File | Purpose |
|---|---|
| `hero-carousel.tsx` | client; `Carousel` with `setApi`, 3 Figma slides (static imports from `@public/assets/images/home/hero/*`; tinted collage, yellow panel + instructor photo, learner photo + teal panel via `HeroSplitSlide`), single `h1` + sub-headline on slide 1, dots only (no prev/next arrows; drag/swipe), autoplay through `useCarouselAutoplay` |
| `home-section-shell.tsx` | props: `title`, `description`, `isLoading`, `error`, `isEmpty`, `onRetry`, `skeletonCount`, `gridClassName`, `skeletonItemClassName`, `emptyMessage`, `errorMessage`, `retryLabel`, `footer?`, `children`; uses `SectionHeader`, `Skeleton`, `Empty*`, `Button` |
| `home-continue-learning-section.tsx` | `useGetMe` + `useHasPermission(PERMISSIONS.CourseRead)` → `enabled`; `useExpandMore(HOME_CONTINUE_*)`; `useContinueLearning(limit, enabled)`; returns `null` when `!enabled`; Expand More button (mandatory comment, design D5) shown when `!isExpanded && rows.length >= HOME_CONTINUE_INITIAL_LIMIT` |
| `continue-learning-card.tsx` | `CourseThumbnail`, title, owner line, `Progress` (`value` clamped 0–100, `aria-label`), text `completed/total`; wraps in `Link` to `courseDetailHref(slug)` only when `slug` is truthy |
| `home-trending-section.tsx` | `useExpandMore(HOME_TRENDING_*)`, `useTrendingCourses(limit)`; Expand More as above |
| `trending-course-card.tsx` | `CourseThumbnail`, title, owner line, `short_description` (`line-clamp`); no price, rating, badge |
| `home-popular-instructors-section.tsx` | `usePopularInstructors(HOME_POPULAR_INSTRUCTORS_LIMIT)`; no Expand More |
| `popular-instructor-card.tsx` | `UserAvatar`-based large portrait (Figma 284×400 card with gradient overlay), `display_name`, `subtitle`; not a link |

Each Expand More handler site carries the two mandatory comments verbatim (design D5). Keys: `item.course_id`, `item.id`, `item.user_id`. No `index` keys. Styles: values read from Figma variables and mapped to existing tokens first. Every file is imported from `signed-in-home-page.tsx` (knip). Tests: §6. Docs: DOC-43, DOC-49.

### H2. `src/screen/common/home/signed-in-home-page.tsx` (MODIFY)

CURRENT final return (lines 46-51):

```tsx
  return (
    <section className="container mx-auto flex max-w-3xl flex-col gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("temporaryNotice")}</p>
    </section>
  );
```

AFTER:

```tsx
  return (
    <div className="container mx-auto flex max-w-[1197px] flex-col gap-11 px-4 py-6">
      <HeroCarousel />
      <HomeContinueLearningSection />
      <HomeTrendingSection />
      <HomePopularInstructorsSection />
    </div>
  );
```

The loading branch, the guest branch (`loginRequired.*`, `loginHref(signedInHomeHref)`) and the three existing imports are unchanged. The doc comment above the component is replaced (it says "temporary" and "Full Figma layout is a later task"). Callers: `home/page.tsx:1`, `screen/common/index.ts:2` (no edit). Docs: DOC-17, DOC-30.

### H3. `src/messages/en.ts` and `src/messages/vi.ts` (MODIFY `home.signedIn`)

CURRENT en (lines 34-43): `signedIn: { title: "Welcome back", temporaryNotice: "...", loginRequired: { title, description, login } }`.

AFTER en (keys; Vietnamese values in `vi.ts` use the same keys):

```ts
    signedIn: {
      loginRequired: { title: "Sign in to continue", description: "This page is available after you sign in.", login: "Sign in" },
      hero: {
        headline: "Learn something new everyday.",
        subheadline: "Become professionals and ready to join the world.",
        instructor: { headline: "Learn from the best.", subheadline: "Courses built by real industry experts." },
        learner: { headline: "Learn at your own pace.", subheadline: "Anytime, anywhere, no deadlines." },
        goToSlide: "Go to slide {index}",
      },
      sectionDescription: "We know the best things for You. Top picks for You.",
      continueLearning: {
        title: "Complete your Course",
        progress: "{completed}/{total} sub-lessons completed",
        empty: "You have no courses in progress yet.",
        error: "We could not load your courses.",
        retry: "Try again",
        expandMore: "Expand More",
      },
      trending: {
        title: "Trending Course",
        empty: "No trending courses yet.",
        error: "We could not load trending courses.",
        retry: "Try again",
        expandMore: "Expand More",
      },
      popularInstructors: {
        title: "Popular Instructor",
        empty: "No instructors to show yet.",
        error: "We could not load instructors.",
        retry: "Try again",
      },
      courseCard: { imageAlt: "{title} thumbnail" },
      coursePlaceholder: {
        title: "Course page coming soon",
        description: "The detailed course page is not available yet.",
        back: "Back to home",
      },
    },
```

`vi.ts` provides Vietnamese values for every key (the `vi` object `satisfies Messages`; `tsc` fails on any missing key). `home.signedIn.title` and `temporaryNotice` are DELETED (their only consumer was the placeholder: `signed-in-home-page.tsx`, verified by grep `home.signedIn`). Files are exempt from `max-lines`. Docs: DOC-29. Verify: `npx tsc --noEmit`.

### H4. `src/constants/seo/image.ts` (comment only)

CURRENT: `/** Full-bleed hero collage (planned signed-in `/home`). */` AFTER: `/** Full-bleed hero collage (signed-in `/home` hero carousel). */`.

### H5. Hero assets (ADD, binary)

`public/assets/images/home/hero/tile-1.webp … tile-8.webp` (slide 1 tiles `Image1..Image8`), `learner-comfortable.webp` (node `5152:11316`), `instructor-recording.webp` (node `5142:11272`); exported through the Figma MCP (`download_assets` / `get_design_context` asset URLs; URLs are short-lived, never committed), converted to WebP. The overlay is CSS (node `5139:30531` colour and opacity recorded in the session context). Docs: DOC-46.

### E1. E2E fixtures and helpers (MODIFY) and E2 spec (ADD)

`e2e/fixtures/server.mjs` (read in full first): ADD handlers before the 404 fallback (around line 708): `GET /api/v1/catalog/courses/trending`, `GET /api/v1/catalog/instructors/popular`, `GET /api/v1/learner-courses/continue` (honouring `limit`, clamped like the backend; the continue route requires the same bearer check as `/me`), reusing `json` / `envelope`; ADD one `USERS` entry `home-learner@example.test` with `permissions: ["course:read"]` and a synthetic `slug` (the existing learner is **not** changed: `auth.spec.ts` relies on its empty permissions). `e2e/support/fixture-client.ts`: export the new user in `FIXTURE_USERS`. `e2e/support/auth.ts`: ADD `loginAsHomeLearner` reusing the existing login helper internals (read first; if `loginAsInstructor`/`loginAsAdmin` duplicate a body, extract the shared body instead of adding a third copy). `e2e/tests/home.spec.ts` (ADD): signed-in home shows the three sections and the hero; Expand More on Trending requests `limit=24` and hides; a card links to `/en/courses/<slug>`; a guest sees the sign-in prompt. Docs: DOC-57, DOC-58.

## 3. Deletions summary

| What | Where | Why safe |
|---|---|---|
| `home.signedIn.title`, `home.signedIn.temporaryNotice` | `en.ts`, `vi.ts` | only the placeholder used them (grep) |
| Placeholder block and "temporary" doc comment | `signed-in-home-page.tsx` | replaced by the real page |
| Stale comments | `route.ts` (`home`), `seo/image.ts` | describe the removed placeholder |

## 4. No-change consumers (verified by grep, not edited)

`src/app/[locale]/(web)/home/page.tsx`, `src/screen/common/index.ts:2`, `src/lib/navigation/home.ts` (re-exports `signedInHomeHref`), `src/constants/seo/routes.ts` (`SIGNED_IN_HOME_PATH`), `src/lib/security/web/crawl-policy.ts` (`signedInHomeRobotsMode`), `src/lib/seo/robots-presets.test.ts`, `src/hooks/auth/use-auth-modal-background-bridge.test.tsx:54` (uses `/home` as a sample), the guest `HomePage` and all `src/components/home/*` mock sections (except the optional header migration in U3), `CourseListItem` consumers, `listPublishedCoursesService` / `getLearningCourseService` / `usePublishedCourses` / `useLearningCourse`, `Header`, `Footer`, `AuthLayout`, `src/proxy.ts`, `next.config.ts`, `publicCacheProfiles`.

## 5. Quality-gate constraints for every new file

`max-lines` 700; `src/types/**` type-only; `src/constants/**` values only; `src/screen` names `page.tsx` / `*-page.tsx` only; no inline lint directives; biome (double quotes, semicolons, organised imports, no unused imports or variables); knip (every new component imported); `madge --circular` (no cycles through `@/screen` ↔ `@/components`); `jscpd` (no duplicated blocks of ≥ 10 lines / 100 tokens outside `ui/`).

## 6. Tests to add (colocated unless noted)

| Test file | Cases |
|---|---|
| `src/api/callers/course/course-keys.test.ts` (or the existing file if present) | trending key with and without `limit`; continue key with `limit`; the continue key is under the private route, the trending key under the public route |
| `src/api/callers/course/course-factory-review.test.ts` | MSW: trending returns items; `data: null` → `[]`; `limit` query is sent as a string; continue sends the same; non-2xx rejects |
| `src/api/callers/instructor/instructor-factory-catalog.test.ts` | popular items map `avatar`; `data: null` → `[]`; `limit` sent |
| `src/api/hooks/course/useHomeCourses.test.tsx` | `useContinueLearning(3, false)` makes no request; `true` fetches; `useTrendingCourses` caches by limit |
| `src/api/hooks/instructor/useInstructorCatalog.test.tsx` | `usePopularInstructors(4)` fetches and returns rows |
| `src/hooks/home/use-expand-more.test.tsx` | initial limit; `expand()` switches to the maximum; second call idempotent |
| `src/lib/navigation/routes.test.ts` | `courseDetailHref("abc")` → `/courses/abc`; special characters are encoded as the builder does |
| `src/components/shared/user-avatar.test.tsx`, `section-header.test.tsx`, `course-thumbnail.test.tsx` | see U1, U3, U5 |
| `src/components/home/signed-in/home-section-shell.test.tsx` | loading skeleton count; empty; error + retry callback; content |
| `src/components/home/signed-in/continue-learning-card.test.tsx` | progress clamped (`-5`, `150`, `12.5`), text interpolation, link only with slug, no link without |
| `src/components/home/signed-in/trending-course-card.test.tsx` | no price/rating/badge text; owner optional; thumbnail optional |
| `src/components/home/signed-in/popular-instructor-card.test.tsx` | `avatar` image vs initials; subtitle optional; not a link |
| `src/components/home/signed-in/home-*-section.test.tsx` (3) | states, Expand More once (limit 8→24 / 3→10, hides), permission gating of the continue section, per-section error independence |
| `src/hooks/home/use-carousel-autoplay.test.tsx` | NEW: 3 s advance, restart on manual change, pause on pointer down, reduced motion, cleanup on unmount |
| `src/components/home/signed-in/hero-carousel.test.tsx` | 3 slides with their own copy, one `h1`, no arrow buttons, dots, first dot current (Embla needs `matchMedia`/`ResizeObserver`, already stubbed; stub `IntersectionObserver` locally if Embla requires it, never in the shared setup) |
| `src/screen/common/home/signed-in-home-page.test.tsx` | loading, guest CTA with `next=/home`, signed-in renders sections, no data request for a guest |
| `src/screen/common/course/course-detail-placeholder-page.test.tsx` | renders title and back link |
| `e2e/tests/home.spec.ts` | see E1 |

> **As built (2026-10-16):** see `design.md` "Implementation notes". `SectionHeader` (U3) was not created; `ExpandMoreFooter`, `CourseCardFrame`/`CourseOwnerLine`, `okEnvelope`, `seedSignedInMe` were added; `getContinueLearningKey(limit, userId)` / `useContinueLearning(limit, userId)` replace the `enabled` boolean; all five avatar copies were migrated to `UserAvatar`; page tests live beside the route files.

> **Placement (final, 2026-10-19):** `UserAvatar` and `CourseThumbnail` (and their tests) live in `src/components/shared/` and are imported by file path (`@/components/shared/user-avatar`, `@/components/shared/course-thumbnail`).
