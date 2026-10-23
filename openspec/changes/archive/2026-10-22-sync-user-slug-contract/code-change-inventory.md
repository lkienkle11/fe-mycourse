# Code Change Inventory

Companion to `design.md` (which summarises each item per file); this file carries the exact CURRENT code, the exact AFTER code, call sites, the reused resource that justifies creating nothing new, tests, and the documentation item IDs from `docs-update-inventory.md`. Frontend only (`fe-mycourse`); do not touch `be-mycourse`. Line numbers are `HEAD 2a807df` and must be re-located by symbol or quote at implementation time. **ADD** = new lines, **MODIFY** = replace, **DELETE** = remove, **MOVE** = relocate.

GitNexus note: the index is one commit behind and type-only symbols (interfaces, type aliases) are poorly represented; `gitnexus_impact` returned no callers for `MeResponse` and could not resolve `UserPickerCandidate`. The caller and consumer lists below come from `grep`/`Read` over `src/`, `e2e/`, `scripts/` and `docs/`. Task 6 of `tasks.md` re-runs `npx gitnexus analyze`, then `impact`/`context` per symbol, and records the result before the first edit.

## 0. Capability audit verdicts that drive this inventory

| ID | Capability | Verdict | Shared module (owner / name) |
|---|---|---|---|
| CAP-1 | User identity row (`user_id`, `display_name`, `email`, `avatar_file_id?`, `avatar_url?`) declared by both `UserPickerCandidate` and `CourseCollaborator` | MERGE | `src/types/user-picker.ts` → `UserPickerCandidate` |
| CAP-2 | Slug format and length validation | REUSE | `src/schema/shared/slug.ts` → `optionalSlugField` (via `@/schema/shared`) |
| CAP-3 | Slug regex and max-length constants | REUSE (through CAP-2) | `src/lib/utils/slug.ts` |
| CAP-4 | Owner collaborator seed row written twice in the fixture server | MERGE (in-file) | `e2e/fixtures/server.mjs` → `seedCollaborators()` |

New sibling-feature import edges: **none**. New files: two tests only.

## 1. Reuse ledger (resources reused as-is, never re-implemented)

| Resource | Path | Used for |
|---|---|---|
| `optionalSlugField` | `src/schema/shared/slug.ts` | the only slug rule in `updateMeSchema` (T3) |
| `UserPickerCandidate` | `src/types/user-picker.ts` | the identity base of `CourseCollaborator` (T5); already imported by `src/types/course.ts:2` |
| `CourseInstructorCandidate = UserPickerCandidate` | `src/types/course.ts:296` | unchanged alias; receives `slug` automatically |
| `AddCollaboratorsBulkResult.added`, `CourseDetail.collaborators`, `AddRosterBulkResult.added`, `InstructorApplication`, `InstructorProfile` | `src/types/course.ts`, `src/types/instructor.ts` | receive `slug` through the changed base types, no edit |
| `mergeInstructorApplicationDetail` | `src/lib/instructor-application/helpers.ts:19-45` | carries `slug` by spread; no edit (pinned by N2) |
| `buildMeResponse` | `src/test-support/fixtures/auth.ts` | shared factory for `use-permissions.test.tsx:95` and `dashboard-layout.test.tsx:91`; they inherit the new field |
| `SLUG_PATTERN`, `SLUG_MAX_LENGTH`, `isSlugAdjusted`, `sanitizeSlugInput` | `src/lib/utils/slug.ts` | unchanged; `SLUG_MAX_LENGTH` is used by N1 |
| `json`, `envelope`, `emptyPaginated`, `CANDIDATE_USER`, `USERS` | `e2e/fixtures/server.mjs` | extended in place |

## 2. Edits per file

### T1. `src/types/auth/auth.ts` — `MeResponse` (MODIFY)

CURRENT (lines 14-25):

```ts
export interface MeResponse {
  user_id: string;
  user_code: string;
  email: string;
  display_name: string;
  avatar_url: string;
  email_confirmed: boolean;
  is_disabled: boolean;
  created_at: number;
  permissions: string[];
  roles: string[];
}
```

AFTER:

```ts
export interface MeResponse {
  user_id: string;
  user_code: string;
  email: string;
  display_name: string;
  /** User slug; `""` until the backend has assigned one (legacy users before backfill). */
  slug: string;
  /** Omitted by the backend when it has no resolved URL; render the fallback avatar then. */
  avatar_url?: string;
  /** Omitted by the backend when it has no object key. */
  avatar_object_key?: string;
  email_confirmed: boolean;
  is_disabled: boolean;
  created_at: number;
  permissions: string[];
  roles: string[];
}
```

- Call sites (all pass-through or truthiness-guarded; no edit): `src/api/callers/auth/auth-factory.ts:11,71-76,178-193`; `src/api/hooks/auth/useAuth.ts:10,14,46`; `src/store/auth/auth.ts:4,11,19`; `src/components/common/auth-menu/user-menu.tsx:10,14,26-29`; `src/components/common/auth-menu/user-menu-dropdown-items.tsx:11,61,83-85`; `src/components/common/header/sidebar-auth-footer.tsx:43,51-53,73` (the last two read `me.avatar_url` behind `me.avatar_url ? <Image .../> : fallback`, so `string | undefined` narrows to `string`).
- Reused: the existing interface; no new type.
- Tests: compile gate (`tsc` inside `next build`); behaviour pinned by F1 and the optional-field scenarios in the spec.
- Docs: DOC-1, DOC-3, DOC-12, DOC-18.

### T2. `src/api/callers/auth/auth-factory.ts` — `UpdateMePayload` (MODIFY)

CURRENT (lines 33-35):

```ts
export interface UpdateMePayload {
  avatar_file_id?: string;
}
```

AFTER:

```ts
export interface UpdateMePayload {
  avatar_file_id?: string;
  /** Omit to leave the slug unchanged; the backend rejects null/empty with 400 and auto-suffixes a taken value (never 409). */
  slug?: string;
}
```

- Call sites: `patchMeService` (`auth-factory.ts:178`, `apiPatch` generic at `:188`) and its re-export `auth-browser.ts:20`; no caller outside these (verified: zero UI consumers). No edit.
- Reused: existing interface; the body is JSON-serialised as is, so no mapper changes.
- Tests: compile gate; N1 pins the matching schema.
- Docs: DOC-4, DOC-9.

### T3. `src/schema/me/me.ts` — `updateMeSchema` (MODIFY)

CURRENT (whole file):

```ts
import { z } from "zod";

/** PATCH /api/v1/me — optional avatar_file_id (valid UUID when provided). */
export const updateMeSchema = z.object({
  avatar_file_id: z
    .string({ message: "validation.avatarFileId" })
    .uuid({ message: "validation.avatarFileId" })
    .optional()
    .or(z.literal("")),
});

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>;
```

AFTER:

```ts
import { z } from "zod";
import { optionalSlugField } from "@/schema/shared";

/**
 * PATCH /api/v1/me — optional avatar_file_id (valid UUID when provided) and
 * optional slug (shared slug format; blank means "do not send").
 */
export const updateMeSchema = z.object({
  avatar_file_id: z
    .string({ message: "validation.avatarFileId" })
    .uuid({ message: "validation.avatarFileId" })
    .optional()
    .or(z.literal("")),
  slug: optionalSlugField.optional(),
});

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>;
```

- Call sites: none (`updateMeSchema` and `UpdateMeFormValues` are imported nowhere; `knip.json` ignores `src/schema/**`, so no dead-code finding).
- Reused: `optionalSlugField` (the same import line as `src/schema/course/course.ts:6` and `src/schema/taxonomy/taxonomy.ts:6`). No regex or length literal is repeated.
- Cycle check: `@/schema/shared` imports only `@/lib/utils/slug`; `npm run cycles` covers it.
- Tests: N1.
- Docs: DOC-13, DOC-15.

### T4. `src/types/user-picker.ts` — `UserPickerCandidate` (MODIFY)

CURRENT (lines 4-10):

```ts
export type UserPickerCandidate = {
  user_id: string;
  display_name: string;
  email: string;
  avatar_file_id?: string;
  avatar_url?: string;
};
```

AFTER:

```ts
export type UserPickerCandidate = {
  user_id: string;
  display_name: string;
  email: string;
  /** User slug; `""` when none is assigned. Display data only, never a selection key. */
  slug: string;
  avatar_file_id?: string;
  avatar_url?: string;
};
```

- Call sites (type consumers, no edit): `src/types/course.ts:2,296` (alias `CourseInstructorCandidate`), `src/types/user-picker.ts:39` (`UserPickerListQuery.rows`), `src/api/callers/instructor/instructor-factory-roster.ts:20,33,37`, `src/api/hooks/instructor/useInstructorRosterCandidates.ts:9,17`, `src/components/shared/user-multi-select-picker-dialog.tsx:19,33` (reads `display_name` and `email` only), `src/components/shared/user-multi-select-picker-dialog.test.tsx:6,11` (literal rows, see F3).
- Reused: the existing shared picker type; this is the owner of the identity shape (CAP-1).
- Docs: DOC-19, DOC-20.

### T5. `src/types/course.ts` — `CourseCollaborator` (MODIFY, merges CAP-1)

CURRENT (lines 78-85):

```ts
export type CourseCollaborator = {
  user_id: string;
  role: CourseCollaboratorRole;
  display_name: string;
  email: string;
  avatar_file_id?: string;
  avatar_url?: string;
};
```

AFTER:

```ts
/** A collaborator is a picker identity plus the collaborator role. */
export type CourseCollaborator = UserPickerCandidate & {
  role: CourseCollaboratorRole;
};
```

- DELETE: the five duplicated identity field lines. Field set and optionality are unchanged (verified line by line: `user_id`, `display_name`, `email` required; `avatar_file_id?`, `avatar_url?` optional) plus `slug` from T4.
- Imports: `UserPickerCandidate` is already imported at `src/types/course.ts:2`; no import change.
- Call sites (no edit): `course.ts:98` (`AddCollaboratorsBulkResult.added`), `course.ts:167` (`CourseDetail.collaborators`), `src/api/callers/course/course-factory-core.ts:16,110,116,158,167`, `src/api/hooks/course/useCourseCollaborators.ts:9,17`, `src/hooks/course/use-course-collaborator-actions.ts:11,28,33,54`, `src/components/features/course/course-editor-collaborators-tab.tsx:26,38,122,195-203`, `src/hooks/course/use-course-collaborator-actions.test.tsx:7,18` (see F2). No `Pick`/`Omit`/`Partial`/`keyof` of `CourseCollaborator` exists (grep), so the intersection form is safe.
- Reused: `UserPickerCandidate`; creates nothing new.
- Docs: DOC-6, DOC-20.

### T6. `src/types/course.ts` — `CourseListItem` (MODIFY)

CURRENT (lines 33-35):

```ts
export type CourseListItem = Course & {
  owner_display_name?: string;
  title: string;
```

AFTER:

```ts
export type CourseListItem = Course & {
  owner_display_name?: string;
  /** Owner user slug; omitted by the backend when empty and not populated on the instructor and learner lists. */
  owner_slug?: string;
  title: string;
```

- Call sites (no edit): `src/types/seo/ranking.ts:1,26` (`Pick<CourseListItem, "slug" | "title" | "thumbnail_url">`), `src/api/callers/course/course-factory-core.ts:21,41-42`, `src/api/callers/course/course-factory-review.ts:19,99-100,164-165,208-209,215-216`, `src/api/hooks/course/useCourses.ts:18,21,44,52,68,76`, `src/components/features/course/course-admin-list-columns.tsx:2,12,27` (renders `owner_display_name` then `owner_user_id`; `owner_slug` intentionally not rendered), `src/components/features/course/course-review-row-actions.tsx:9,13-16`, `src/screen/common/course/course-admin-all-page.tsx:16,23,25`, `course-admin-trash-page.tsx:18,25,27,37`, `course-review-page.tsx:31,42,46,57`, `src/screen/instructor/courses/page.tsx:31,47,66`.
- Not added to `Course`: the backend puts `owner_slug` only on `CourseListItem` (`Course` has `owner_user_id`).
- Docs: DOC-8, DOC-11.

### T7. `src/types/instructor.ts` — `MyInstructorApplication` (MODIFY)

CURRENT (lines 98-103):

```ts
export type MyInstructorApplication = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar?: string;
```

AFTER:

```ts
export type MyInstructorApplication = {
  id: string;
  user_id: string;
  display_name: string;
  /** User slug; `""` when none is assigned. */
  slug: string;
  email: string;
  avatar?: string;
```

- Call sites (no edit): `src/api/callers/instructor/instructor-factory-application.ts:19,34-37,51,60,72,81`, `src/hooks/instructor/use-my-instructor-application.ts:18,31`, `src/lib/instructor-application/helpers.ts:6,67-77` (reads `topics`/`skills`), `form-state.ts:9,76,157` (reads `latest_submission`), `get-page-state.ts:6,10` (reads `review_status` and flags), `get-page-state.test.ts:7-23` (see F4).
- Kept separate from `InstructorUserIdentity` on purpose (see `design.md` audit).
- Docs: DOC-27.

### T8. `src/types/instructor.ts` — `InstructorUserIdentity` (MODIFY)

CURRENT (lines 149-158):

```ts
export type InstructorUserIdentity = {
  full_name: string;
  avatar: string;
  display_name?: string;
  email?: string;
  is_disabled?: boolean;
  email_confirmed?: boolean;
  banned_until?: number | null;
  is_banned?: boolean;
};
```

AFTER:

```ts
export type InstructorUserIdentity = {
  full_name: string;
  avatar: string;
  /** User slug; `""` when none is assigned. */
  slug: string;
  display_name?: string;
  email?: string;
  is_disabled?: boolean;
  email_confirmed?: boolean;
  banned_until?: number | null;
  is_banned?: boolean;
};
```

- Inherited by `InstructorApplication` (`instructor.ts:168`) and `InstructorProfile` (`:185`).
- Call sites (no edit): `src/types/seo/ranking.ts:4,47` (`Pick<..., "full_name" | "avatar">`), `src/lib/instructor-application/applicant-eligibility.ts:1,4` (`Pick` of status flags), `src/components/features/instructor/instructor-user-cell.tsx:7,11-19` (`Partial<Pick<...>>` of other fields), `src/lib/instructor-application/helpers.ts:2,11,20-22,49-50` (`mergeInstructorApplicationDetail`: the returned literal spreads `...listRow, ...detail` first, so it still satisfies the required `slug`), `src/api/callers/instructor/instructor-factory-application.ts:17,105-167`, `instructor-factory-profile.ts:15,26,37`, `src/api/hooks/instructor/useInstructorApplications.ts:11,16,27`, `useInstructorProfiles.ts:12,16,25`, `src/components/features/instructor/instructor-profile-view-dialog.tsx:20,40`, `instructor-action-controls.tsx:13,137,204`, `instructor-approvals-row-actions.tsx:29,35`, `src/screen/common/instructor/instructor-approvals-page.tsx:34,49,55,85`.
- Not extended into `InstructorTicket` (the backend ticket response has no slug).
- Docs: DOC-25.

### T9. `src/types/instructor.ts` — `InstructorRosterMember` (MODIFY)

CURRENT (lines 160-166):

```ts
export type InstructorRosterMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
};
```

AFTER:

```ts
export type InstructorRosterMember = {
  id: string;
  full_name: string;
  /** User slug; `""` when none is assigned. */
  slug: string;
  email: string;
  phone: string;
  avatar: string;
};
```

- Also types `AddRosterBulkResult.added` (`instructor.ts:253`).
- Call sites (no edit): `src/api/callers/instructor/instructor-factory-roster.ts:17,59,63`, `src/api/hooks/instructor/useInstructorRoster.ts:10,14`, `src/screen/common/instructor/instructor-roster-page.tsx:41,59,139,146-151,174-175,193-196,286`, `src/screen/common/instructor/instructor-expertise-page.tsx:32,78-81` (`mapInstructorOption` reads `id`, `full_name`, `email` only), `src/types/seo/ranking.ts:3,48` (`Partial<Pick<..., "id" | "email">>`).
- Docs: DOC-25.

### F1. `src/test-support/fixtures/auth.ts` — `buildMeResponse` (MODIFY)

CURRENT (lines 8-18):

```ts
  return {
    user_id: "user-1",
    user_code: "U-0001",
    email: "learner@example.com",
    display_name: "Test Learner",
    avatar_url: "",
    email_confirmed: true,
    is_disabled: false,
    created_at: 1_700_000_000,
    permissions: [],
    roles: [],
    ...overrides,
  };
```

AFTER:

```ts
  return {
    user_id: "user-1",
    user_code: "U-0001",
    email: "learner@example.com",
    display_name: "Test Learner",
    slug: "test-learner",
    email_confirmed: true,
    is_disabled: false,
    created_at: 1_700_000_000,
    permissions: [],
    roles: [],
    ...overrides,
  };
```

- DELETE `avatar_url: ""` (the backend omits the key; no test reads it).
- Call sites (no edit): `src/hooks/auth/use-permissions.test.tsx:10,95`, `src/components/common/dashboard/dashboard-layout.test.tsx:11,91`.
- Docs: DOC-16, DOC-22.

### F2. `src/hooks/course/use-course-collaborator-actions.test.tsx` — `buildCollaborator` (MODIFY)

CURRENT (lines 18-25):

```ts
function buildCollaborator(userId: string): CourseCollaborator {
  return {
    user_id: userId,
    role: "EDITOR",
    display_name: `User ${userId}`,
    email: `${userId}@example.com`,
  };
}
```

AFTER:

```ts
function buildCollaborator(userId: string): CourseCollaborator {
  return {
    user_id: userId,
    role: "EDITOR",
    display_name: `User ${userId}`,
    email: `${userId}@example.com`,
    slug: `user-${userId}`,
  };
}
```

- Call sites (no edit): the same file at lines 39, 108, 124.

### F3. `src/components/shared/user-multi-select-picker-dialog.test.tsx` — `rows` (MODIFY)

CURRENT (lines 11-14):

```ts
const rows: UserPickerCandidate[] = [
  { user_id: "user-1", display_name: "Alice", email: "alice@example.com" },
  { user_id: "user-2", display_name: "Bob", email: "bob@example.com" },
];
```

AFTER:

```ts
const rows: UserPickerCandidate[] = [
  {
    user_id: "user-1",
    display_name: "Alice",
    email: "alice@example.com",
    slug: "alice",
  },
  {
    user_id: "user-2",
    display_name: "Bob",
    email: "bob@example.com",
    slug: "bob",
  },
];
```

### F4. `src/lib/instructor-application/get-page-state.test.ts` — `buildApplication` (MODIFY)

CURRENT (lines 10-21):

```ts
  return {
    id: "app-1",
    user_id: "user-1",
    display_name: "Learner",
    email: "learner@example.com",
    review_status: "pending",
    can_resubmit: false,
    rejection_count: 0,
    latest_submission: null,
    rejection_history: [],
    ...overrides,
  };
```

AFTER: insert `slug: "learner",` immediately after `display_name: "Learner",`; nothing else changes.

### E1–E4. `e2e/fixtures/server.mjs` (MODIFY; plain `.mjs`, not type-checked)

**E1 — `USERS`** (lines 24-61): add one `slug` line to each entry after `display_name`:

```js
    display_name: "Fixture Instructor",
    slug: "fixture-instructor",
```
```js
    display_name: "Fixture Admin",
    slug: "fixture-admin",
```
```js
    display_name: "Fixture Learner",
    slug: "fixture-learner",
```

**E2 — `CANDIDATE_USER`** (lines 63-67):

```js
const CANDIDATE_USER = {
  user_id: "user-candidate",
  display_name: "Candidate Collaborator",
  email: "candidate@example.test",
  slug: "candidate-collaborator",
};
```

It is spread into the bulk-add `added[]` row (`server.mjs:564-568`) and returned by the candidates list (`:546-556`), so one edit covers both responses.

**E4 — owner collaborator seed (MERGE, CAP-4)** CURRENT (lines 178-185 and again 190-197 inside `resetState()`): the identical literal

```js
let collaborators = [
  {
    user_id: "user-instructor",
    role: "OWNER",
    display_name: "Fixture Instructor",
    email: "instructor@example.test",
  },
];
```

AFTER: DELETE both literals and add one function, placed directly above `let collaborators`:

```js
/** Fresh owner-only collaborator list; the fixture course starts and resets to this. */
function seedCollaborators() {
  const email = "instructor@example.test";
  const owner = USERS[email];
  return [
    {
      user_id: owner.id,
      role: "OWNER",
      display_name: owner.display_name,
      email,
      slug: owner.slug,
    },
  ];
}

let collaborators = seedCollaborators();
```

and in `resetState()` replace the inline array with `collaborators = seedCollaborators();`. (`USERS` is declared at line 24, before the call; `seedCollaborators` is a hoisted function declaration.) The owner row's identity now comes from `USERS`, so the display name, id and slug exist once.

**E3 — `userMeResponse`** (lines 271-286): add `slug: user.slug,` after `display_name: user.display_name,` and DELETE `avatar_url: "",`.

- Call sites (no edit): `GET /api/v1/me` handler (`:451-462`), the course-detail builder (`:323-358`, embeds `collaborators` at `:356`), the collaborators list (`:539-545`), bulk add (`:557-580`).
- Not changed: `GET /api/v1/courses/my` (`:697-699`, returns `[]`, no row to carry `owner_slug`); there is no roster, application or admin-course mock.
- Docs: DOC-23.

### N1. `src/schema/me/me.test.ts` (ADD)

Colocated Jest test (same style as `src/schema/shared/slug.test.ts`; `jest` project `jsdom` already matches `src/schema/**/*.test.ts`):

```ts
import { describe, expect, it } from "@jest/globals";
import { SLUG_MAX_LENGTH } from "@/lib/utils/slug";
import { updateMeSchema } from "./me";

const AVATAR_ID = "0190a5f0-7c3e-7b1a-9d2e-3f4a5b6c7d8e";

function firstMessage(value: unknown) {
  const result = updateMeSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("updateMeSchema", () => {
  it("accepts an empty body (avatar and slug both optional)", () => {
    expect(updateMeSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid avatar UUID and a blank avatar", () => {
    expect(updateMeSchema.safeParse({ avatar_file_id: AVATAR_ID }).success).toBe(true);
    expect(updateMeSchema.safeParse({ avatar_file_id: "" }).success).toBe(true);
  });

  it("rejects a non-UUID avatar with validation.avatarFileId", () => {
    expect(firstMessage({ avatar_file_id: "not-a-uuid" })).toBe("validation.avatarFileId");
  });

  it.each(["go", "my-name-2", "a1"])("accepts slug %j", (slug) => {
    expect(updateMeSchema.safeParse({ slug }).success).toBe(true);
  });

  it("treats a blank slug as 'do not send' (accepted)", () => {
    expect(updateMeSchema.safeParse({ slug: "" }).success).toBe(true);
  });

  it.each(["-go", "go-", "Go", "go_lang", "go lang"])("rejects slug %j with validation.slugInvalid", (slug) => {
    expect(firstMessage({ slug })).toBe("validation.slugInvalid");
  });

  it("rejects an over-length slug with validation.slugMax", () => {
    expect(firstMessage({ slug: "a".repeat(SLUG_MAX_LENGTH + 1) })).toBe("validation.slugMax");
  });
});
```

(The avatar UUID literal is a synthetic placeholder.) Formatting must satisfy `biome`; run `npm run fix:biome` on the new files only if the formatter reports differences.

- Docs: DOC-28.

### N2. `src/lib/instructor-application/helpers.test.ts` (ADD)

```ts
import { describe, expect, it } from "@jest/globals";
import type { InstructorApplication } from "@/types/instructor";
import { mergeInstructorApplicationDetail } from "./helpers";

function buildApplication(overrides: Partial<InstructorApplication> = {}): InstructorApplication {
  return {
    id: "app-1",
    user_id: "user-1",
    full_name: "Applicant",
    avatar: "",
    slug: "applicant",
    review_status: "pending",
    ...overrides,
  };
}

describe("mergeInstructorApplicationDetail", () => {
  it("returns the list row when there is no detail", () => {
    const row = buildApplication();
    expect(mergeInstructorApplicationDetail(row, null)).toBe(row);
  });

  it("returns the detail when there is no list row", () => {
    const detail = buildApplication({ slug: "from-detail" });
    expect(mergeInstructorApplicationDetail(null, detail)).toBe(detail);
  });

  it("keeps the slug returned by the detail when merged with a list row", () => {
    const merged = mergeInstructorApplicationDetail(
      buildApplication({ slug: "from-list" }),
      buildApplication({ slug: "from-detail" }),
    );
    expect(merged?.slug).toBe("from-detail");
  });
});
```

- Docs: DOC-28.

## 3. Deletions summary

| File | Deleted |
|---|---|
| `src/types/course.ts` | the five duplicated identity field lines of `CourseCollaborator` |
| `src/test-support/fixtures/auth.ts` | `avatar_url: ""` |
| `e2e/fixtures/server.mjs` | `avatar_url: ""` in `userMeResponse`; the two inline owner-collaborator array literals (replaced by `seedCollaborators()`) |

No source file, export, route or message key is deleted. No i18n key is added (no UI text changes).

## 4. Consumers that reference the changed types and need NO change

Verified by grep and read; each is pass-through, reads unrelated fields, or uses `Partial`/`Pick` of other fields.

- Callers and hooks: `src/api/callers/auth/auth-browser.ts`; `src/api/callers/course/course-factory-core.ts`, `course-factory-review.ts`; `src/api/callers/instructor/instructor-factory-application.ts`, `instructor-factory-roster.ts`, `instructor-factory-profile.ts`; `src/api/hooks/auth/useAuth.ts`; `src/api/hooks/course/useCourses.ts`, `useCourseCollaborators.ts`; `src/api/hooks/instructor/useInstructorRoster.ts`, `useInstructorRosterCandidates.ts`, `useInstructorApplications.ts`, `useInstructorProfiles.ts`; `src/store/auth/auth.ts`.
- Components and screens: `src/components/common/auth-menu/user-menu.tsx`, `user-menu-dropdown-items.tsx`; `src/components/common/header/sidebar-auth-footer.tsx`; `src/components/shared/user-multi-select-picker-dialog.tsx`; `src/components/features/course/course-editor-collaborators-tab.tsx`, `course-admin-list-columns.tsx`, `course-review-row-actions.tsx`; `src/components/features/instructor/instructor-user-cell.tsx`, `instructor-profile-view-dialog.tsx`, `instructor-action-controls.tsx`, `instructor-approvals-row-actions.tsx`; `src/screen/common/course/course-admin-all-page.tsx`, `course-admin-trash-page.tsx`, `course-review-page.tsx`; `src/screen/instructor/courses/page.tsx`; `src/screen/common/instructor/instructor-roster-page.tsx`, `instructor-expertise-page.tsx`, `instructor-approvals-page.tsx`, `instructor-tickets-admin-page.tsx`.
- Hooks and libs: `src/hooks/course/use-course-collaborator-actions.ts`; `src/hooks/instructor/use-my-instructor-application.ts`; `src/lib/instructor-application/applicant-eligibility.ts`, `form-state.ts`, `get-page-state.ts`, `helpers.ts`; `src/lib/seo/ranking/course.ts`, `person.ts`; `src/types/seo/ranking.ts`.
- Tests with untyped or empty literals: `src/hooks/course/use-course-create-flow.test.tsx` (`collaborators: []`), `src/lib/utils/course.test.ts`, `src/hooks/course/use-course-outline-reorder.test.tsx` (cast), `src/lib/utils/user-picker-bulk-submit.test.ts` (local type), `src/lib/swr/me-cache-provider.test.ts` (untyped `{ data: { email } }`), `src/hooks/auth/use-permissions.test.tsx` and `src/components/common/dashboard/dashboard-layout.test.tsx` (use `buildMeResponse`).
- Config: `tsconfig.json` (e2e `.ts` included, `.mjs` not), `jest.config.ts` (no coverage threshold touched), `knip.json`, `.jscpd.json`, `eslint.config.mjs`, `biome.json`, `playwright.config.ts`, `e2e/tests/*.spec.ts`, `e2e/support/*`, `scripts/e2e-lifecycle.mjs`.

## 5. Verification commands (all from `fe-mycourse/`)

| Purpose | Command |
|---|---|
| Type check the whole project quickly | `npx tsc --noEmit` |
| New unit tests | `npx jest src/schema/me/me.test.ts src/lib/instructor-application/helpers.test.ts --ci` |
| Touched existing tests | `npx jest src/hooks/course/use-course-collaborator-actions.test.tsx src/components/shared/user-multi-select-picker-dialog.test.tsx src/lib/instructor-application/get-page-state.test.ts src/hooks/auth/use-permissions.test.tsx src/components/common/dashboard/dashboard-layout.test.tsx --ci` |
| Full gate (lint, biome, test, knip, cycles, jscpd, build) | `npm run check-all` |
| Browser journeys against the fixture backend | `npm run test:e2e` |
| Leftover-text sweep | `grep -rn "avatar_url: string\|{ avatar_file_id?: uuid }" README.md docs src` must return nothing relevant |
