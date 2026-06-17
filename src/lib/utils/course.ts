import type { ZodIssue } from "zod";
import {
  countDeltaNonWhitespace,
  createEmptyDeltaString,
} from "@/lib/utils/course-delta";
import {
  isDurationWithinMaxMs,
  parseDurationPartsToMs,
  splitMsToDurationParts,
} from "@/lib/utils/duration";
import { newV7 } from "@/lib/utils/uuid";
import { firstValidationMessageKey } from "@/lib/utils/validation-message";
import { courseBasicInfoSchema, courseQuizOptionSchema } from "@/schema/course";
import type {
  CourseBasicInfoForm,
  CourseDetail,
  CourseEditorTab,
  CourseLesson,
  CourseSection,
  CourseSubLesson,
  CourseSubLessonFormState,
  CourseSubLessonKind,
  CourseVersion,
  UpdateCourseBasicInfoPayload,
  UpsertCourseQuizOptionPayload,
} from "@/types/course";

export type CourseValidationMessageKey =
  | "videoMediaRequired"
  | "textContentRequired"
  | "submitInvalidSubLesson"
  | "quizCorrectAnswerRequired"
  | "quizSingleChoiceMultipleCorrect"
  | "quizPreviewNotAllowed"
  | "submitBasicInfoIncomplete"
  | "submitCollaboratorRequired"
  | "submitOutlineNoSections"
  | "submitOutlineNoLessons"
  | "submitOutlineNoItems";

export const courseEditorTabs = [
  "info",
  "outline",
  "collaborators",
  "pricing",
  "certificate",
] as const satisfies ReadonlyArray<CourseEditorTab>;

export function createCourseBasicInfoState(
  activeVersion?: CourseVersion,
): CourseBasicInfoForm {
  return {
    title: activeVersion?.title ?? "",
    short_description: activeVersion?.short_description ?? "",
    about_course: activeVersion?.about_course ?? createEmptyDeltaString(),
    thumbnail_file_id: activeVersion?.thumbnail_file_id ?? "",
    thumbnail_url: activeVersion?.thumbnail_url ?? "",
    preview_video_file_id: activeVersion?.preview_video_file_id ?? "",
    preview_video_url: activeVersion?.preview_video_url ?? "",
    course_level_id: activeVersion?.course_level_id ?? "",
    course_topic_id: activeVersion?.course_topic_id ?? "",
    tag_ids: activeVersion?.tag_ids ?? [],
    skill_ids: activeVersion?.skill_ids ?? [],
    outcome_ids: activeVersion?.outcome_ids ?? [],
    expected_row_version: activeVersion?.row_version ?? 0,
  };
}

export function toUpdateCourseBasicInfoPayload(
  basicInfo: CourseBasicInfoForm,
): UpdateCourseBasicInfoPayload {
  const payload: UpdateCourseBasicInfoPayload = {
    expected_row_version: basicInfo.expected_row_version,
    title: basicInfo.title.trim(),
    short_description: basicInfo.short_description.trim(),
    about_course: basicInfo.about_course.trim(),
    thumbnail_file_id: basicInfo.thumbnail_file_id,
    course_level_id: basicInfo.course_level_id,
    course_topic_id: basicInfo.course_topic_id,
    tag_ids: basicInfo.tag_ids,
    skill_ids: basicInfo.skill_ids,
    outcome_ids: basicInfo.outcome_ids,
  };
  if (basicInfo.preview_video_file_id) {
    payload.preview_video_file_id = basicInfo.preview_video_file_id;
  }
  return payload;
}

function createEmptyQuizOption() {
  return {
    option_key: newV7(),
    body: "",
    is_correct: false,
  };
}

export function createCourseSubLessonFormState(
  lessonId = "",
  subLesson?: CourseSubLesson,
): CourseSubLessonFormState {
  const durationParts = splitMsToDurationParts(
    subLesson?.estimated_duration_ms ?? 0,
  );
  return {
    lesson_id: lessonId,
    title: subLesson?.title ?? "",
    kind: subLesson?.kind ?? "VIDEO",
    is_preview: subLesson?.is_preview ?? false,
    expected_row_version: subLesson?.row_version ?? 0,
    duration_hours: durationParts.hours,
    duration_minutes: durationParts.minutes,
    duration_seconds: durationParts.seconds,
    video_file_id: subLesson?.video?.media_file_id ?? "",
    video_url: subLesson?.video?.media_url ?? "",
    video_duration_seconds:
      subLesson?.kind === "VIDEO" && subLesson.estimated_duration_ms
        ? Math.floor(subLesson.estimated_duration_ms / 1000)
        : 0,
    text_delta: subLesson?.text?.content_delta ?? createEmptyDeltaString(),
    quiz_prompt: subLesson?.quiz?.prompt ?? "",
    allow_multiple: subLesson?.quiz?.allow_multiple ?? false,
    quiz_options: subLesson?.quiz?.options?.map((option) => ({
      option_key: option.option_key,
      body: option.body,
      is_correct: option.is_correct,
    })) ?? [createEmptyQuizOption()],
  };
}

/** Returns ms for TEXT/QUIZ payloads; undefined means omit (VIDEO). */
export function buildSubLessonEstimatedDurationPayload(
  form: CourseSubLessonFormState,
): number | undefined {
  if (form.kind === "VIDEO") {
    return undefined;
  }
  return parseDurationPartsToMs(
    form.duration_hours,
    form.duration_minutes,
    form.duration_seconds,
  );
}

export function validateSubLessonDurationForm(
  form: CourseSubLessonFormState,
): boolean {
  if (form.kind === "VIDEO") {
    return true;
  }
  const ms = buildSubLessonEstimatedDurationPayload(form);
  return ms !== undefined && isDurationWithinMaxMs(ms);
}

export function selectedIdsToMap(ids: string[]) {
  return new Set(ids);
}

/** OUTLINE_ROOT lease key — course id is already a UUID v7 from BE. */
export function rootOutlineStableId(courseId: string): string {
  return courseId;
}

/** Assign `order_index` 0..n-1 to match UI sort order (optimistic outline updates). */
export function assignSequentialOrderIndex<T extends { order_index: number }>(
  items: readonly T[],
): T[] {
  return items.map((item, index) =>
    item.order_index === index ? item : { ...item, order_index: index },
  );
}

export function withOutlineSections(
  detail: CourseDetail,
  sections: CourseSection[],
): CourseDetail {
  return { ...detail, outline: sections };
}

export function replaceSectionLessons(
  outline: CourseSection[],
  sectionId: string,
  lessons: CourseLesson[],
): CourseSection[] {
  const orderedLessons = assignSequentialOrderIndex(lessons);
  return outline.map((section) =>
    section.id === sectionId
      ? { ...section, lessons: orderedLessons }
      : section,
  );
}

export function replaceLessonSubLessons(
  outline: CourseSection[],
  lessonId: string,
  subLessons: CourseSubLesson[],
): CourseSection[] {
  const orderedSubLessons = assignSequentialOrderIndex(subLessons);
  return outline.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) =>
      lesson.id === lessonId
        ? { ...lesson, sub_lessons: orderedSubLessons }
        : lesson,
    ),
  }));
}

export function mergeReorderedLessons(
  outline: CourseSection[],
  sectionId: string,
  lessons: CourseLesson[],
): CourseSection[] {
  return outline.map((section) =>
    section.id === sectionId ? { ...section, lessons } : section,
  );
}

export function mergeReorderedSubLessons(
  outline: CourseSection[],
  lessonId: string,
  subLessons: CourseSubLesson[],
): CourseSection[] {
  return outline.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, sub_lessons: subLessons } : lesson,
    ),
  }));
}

function validateQuizContent(input: {
  allow_multiple: boolean;
  prompt: string;
  options: { body: string; is_correct: boolean }[];
}): CourseValidationMessageKey | null {
  const parsed = courseQuizOptionSchema.safeParse(input);
  if (parsed.success) {
    return null;
  }
  return firstValidationMessageKey(
    parsed.error.issues,
    "submitInvalidSubLesson",
  ) as CourseValidationMessageKey;
}

export function applyQuizAllowMultipleChange(
  allowMultiple: boolean,
  quizOptions: UpsertCourseQuizOptionPayload[],
): Pick<CourseSubLessonFormState, "allow_multiple" | "quiz_options"> {
  if (allowMultiple) {
    return { allow_multiple: true, quiz_options: quizOptions };
  }
  return {
    allow_multiple: false,
    quiz_options: quizOptions.map((item, index) => ({
      ...item,
      is_correct: index === 0,
    })),
  };
}

export function applyQuizOptionCorrectChange(
  allowMultiple: boolean,
  quizOptions: UpsertCourseQuizOptionPayload[],
  optionKey: string,
  checked: boolean,
): UpsertCourseQuizOptionPayload[] {
  return quizOptions.map((item) => {
    if (item.option_key !== optionKey) {
      return allowMultiple ? item : { ...item, is_correct: false };
    }
    return { ...item, is_correct: checked };
  });
}

function validateSubLessonReadiness(
  subLesson: CourseSubLesson,
): CourseValidationMessageKey | null {
  if (subLesson.kind === "VIDEO") {
    if (!subLesson.video?.media_file_id?.trim()) {
      return "submitInvalidSubLesson";
    }
    return null;
  }

  if (subLesson.kind === "TEXT") {
    if (countDeltaNonWhitespace(subLesson.text?.content_delta ?? "") < 1) {
      return "textContentRequired";
    }
    return null;
  }

  if (subLesson.kind === "QUIZ") {
    if (subLesson.is_preview) {
      return "quizPreviewNotAllowed";
    }
    return validateQuizContent({
      allow_multiple: subLesson.quiz?.allow_multiple ?? false,
      prompt: subLesson.quiz?.prompt ?? "",
      options: subLesson.quiz?.options ?? [],
    });
  }

  return "submitInvalidSubLesson";
}

export function validateSubLessonFormContent(input: {
  kind: CourseSubLessonKind;
  video_file_id?: string;
  text_delta?: string;
  allow_multiple?: boolean;
  quiz_prompt?: string;
  quiz_options?: { body: string; is_correct: boolean }[];
}): CourseValidationMessageKey | null {
  if (input.kind === "VIDEO") {
    return input.video_file_id?.trim() ? null : "videoMediaRequired";
  }

  if (input.kind === "TEXT") {
    return countDeltaNonWhitespace(input.text_delta ?? "") >= 1
      ? null
      : "textContentRequired";
  }

  if (input.kind === "QUIZ") {
    return validateQuizContent({
      allow_multiple: input.allow_multiple ?? false,
      prompt: input.quiz_prompt ?? "",
      options: input.quiz_options ?? [],
    });
  }

  return "submitInvalidSubLesson";
}

export function validateCourseSubmitReadiness(
  detail: CourseDetail,
): ZodIssue[] | null {
  const draftVersion = detail.draft_version;
  if (!draftVersion) {
    return [
      { code: "custom", path: ["draft"], message: "submitBasicInfoIncomplete" },
    ];
  }

  const basicInfo = courseBasicInfoSchema.safeParse(
    createCourseBasicInfoState(draftVersion),
  );
  if (!basicInfo.success) {
    return basicInfo.error.issues.map((issue) => ({
      ...issue,
      message: "submitBasicInfoIncomplete",
    }));
  }

  if (detail.collaborators.length < 1) {
    return [
      {
        code: "custom",
        path: ["collaborators"],
        message: "submitCollaboratorRequired",
      },
    ];
  }

  if (detail.outline.length < 1) {
    return [
      { code: "custom", path: ["outline"], message: "submitOutlineNoSections" },
    ];
  }

  for (const section of detail.outline) {
    if (section.lessons.length < 1) {
      return [
        {
          code: "custom",
          path: ["outline"],
          message: "submitOutlineNoLessons",
        },
      ];
    }
    for (const lesson of section.lessons) {
      if (lesson.sub_lessons.length < 1) {
        return [
          {
            code: "custom",
            path: ["outline"],
            message: "submitOutlineNoItems",
          },
        ];
      }
      for (const subLesson of lesson.sub_lessons) {
        const issueKey = validateSubLessonReadiness(subLesson);
        if (issueKey) {
          return [
            {
              code: "custom",
              path: ["outline"],
              message: issueKey,
            },
          ];
        }
      }
    }
  }

  return null;
}

/** Matches BE `courseEligibleForTrash`: published approved + draft not rejected. */
export function canMoveCourseToTrash(row: {
  has_published: boolean;
  draft_review_status?: string;
}): boolean {
  return row.has_published && row.draft_review_status !== "REJECTED";
}
