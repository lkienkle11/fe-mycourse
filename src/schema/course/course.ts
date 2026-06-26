import { z } from "zod";
import {
  countDeltaNonWhitespace,
  countNonWhitespace,
} from "@/lib/utils/course-delta";

const titleField = z
  .string({ message: "validation.title" })
  .trim()
  .refine((value) => countNonWhitespace(value) >= 5, {
    message: "validation.titleMin",
  })
  .max(255, { message: "validation.titleMax" });

const requiredUuid = (message: string) =>
  z.string().trim().min(1, { message }).uuid({ message });

export const courseCreateSchema = z.object({
  title: titleField,
});

export const courseBasicInfoSchema = z.object({
  title: titleField,
  short_description: z
    .string()
    .trim()
    .refine((value) => countNonWhitespace(value) >= 20, {
      message: "validation.shortDescriptionMin",
    })
    .max(500, { message: "validation.shortDescriptionMax" }),
  about_course: z
    .string()
    .refine((value) => countDeltaNonWhitespace(value) >= 30, {
      message: "validation.aboutCourseMin",
    }),
  thumbnail_file_id: requiredUuid("validation.thumbnailRequired"),
  thumbnail_url: z.string(),
  preview_video_file_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "validation.previewVideoFileId" }),
  ]),
  preview_video_url: z.string(),
  course_level_id: requiredUuid("validation.courseLevelId"),
  course_topic_id: requiredUuid("validation.courseTopicId"),
  tag_ids: z
    .array(z.string().uuid())
    .min(1, { message: "validation.tagIdsMin" }),
  skill_ids: z
    .array(z.string().uuid())
    .min(1, { message: "validation.skillIdsMin" }),
  outcome_ids: z
    .array(z.string().uuid())
    .length(1, { message: "validation.outcomeIdRequired" }),
  expected_row_version: z
    .number({ message: "validation.expectedRowVersion" })
    .int({ message: "validation.expectedRowVersion" })
    .min(1, { message: "validation.expectedRowVersion" }),
});

const outlineBodyField = (message: string) =>
  z.string().refine((value) => countDeltaNonWhitespace(value) >= 20, {
    message,
  });

export const courseSectionSchema = z.object({
  title: titleField,
  description: outlineBodyField("validation.sectionDescriptionMin"),
});

export const courseLessonSchema = z.object({
  title: titleField,
  summary: outlineBodyField("validation.lessonSummaryMin"),
});

export const courseSubLessonSchema = z.object({
  title: titleField,
  kind: z.enum(["VIDEO", "QUIZ", "TEXT"], {
    message: "validation.subLessonKind",
  }),
});

const quizAnswerOptionField = z.object({
  body: z
    .string({ message: "validation.quizOptionBody" })
    .trim()
    .min(1, { message: "validation.quizOptionBody" }),
  is_correct: z.boolean(),
});

export const courseQuizOptionSchema = z
  .object({
    allow_multiple: z.boolean(),
    prompt: z
      .string({ message: "validation.quizPrompt" })
      .trim()
      .min(1, { message: "validation.quizPrompt" }),
    options: z
      .array(quizAnswerOptionField)
      .min(1, { message: "validation.quizOptionsMin" }),
  })
  .superRefine((value, ctx) => {
    const correctCount = value.options.filter(
      (option) => option.is_correct,
    ).length;
    if (correctCount === 0) {
      ctx.addIssue({
        code: "custom",
        message: "validation.quizCorrectAnswerRequired",
      });
      return;
    }
    if (!value.allow_multiple && correctCount > 1) {
      ctx.addIssue({
        code: "custom",
        message: "validation.quizSingleChoiceMultipleCorrect",
      });
    }
  });

export const courseRejectReasonSchema = z.object({
  reason: z
    .string({ message: "validation.rejectReason" })
    .trim()
    .min(5, { message: "validation.rejectReasonMin" })
    .max(500, { message: "validation.rejectReasonMax" }),
});

export const courseApproveFeedbackSchema = z.object({
  approval_note: z
    .string({ message: "validation.approveFeedback" })
    .trim()
    .min(5, { message: "validation.approveFeedbackMin" })
    .max(500, { message: "validation.approveFeedbackMax" }),
});

export type CourseCreateValues = z.infer<typeof courseCreateSchema>;
export type CourseBasicInfoValues = z.infer<typeof courseBasicInfoSchema>;
export type CourseSectionValues = z.infer<typeof courseSectionSchema>;
export type CourseLessonValues = z.infer<typeof courseLessonSchema>;
export type CourseSubLessonValues = z.infer<typeof courseSubLessonSchema>;
export type CourseQuizContentValues = z.infer<typeof courseQuizOptionSchema>;
export type CourseRejectReasonValues = z.infer<typeof courseRejectReasonSchema>;
export type CourseApproveFeedbackValues = z.infer<
  typeof courseApproveFeedbackSchema
>;
