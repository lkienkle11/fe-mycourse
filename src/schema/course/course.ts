import { z } from "zod";

const titleField = z
  .string({ message: "validation.title" })
  .trim()
  .min(1, { message: "validation.title" })
  .max(255, { message: "validation.titleMax" });

export const courseCreateSchema = z.object({
  title: titleField,
});

export const courseBasicInfoSchema = z.object({
  title: titleField,
  short_description: z
    .string()
    .max(500, { message: "validation.shortDescriptionMax" }),
  about_course: z.string(),
  thumbnail_file_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "validation.thumbnailFileId" }),
  ]),
  thumbnail_url: z.string(),
  preview_video_file_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "validation.previewVideoFileId" }),
  ]),
  preview_video_url: z.string(),
  course_level_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "validation.courseLevelId" }),
  ]),
  course_topic_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "validation.courseTopicId" }),
  ]),
  tag_ids: z.array(z.string().uuid()),
  skill_ids: z.array(z.string().uuid()),
  outcome_ids: z.array(z.string().uuid()),
  expected_row_version: z
    .number({ message: "validation.expectedRowVersion" })
    .int({ message: "validation.expectedRowVersion" })
    .min(1, { message: "validation.expectedRowVersion" }),
});

export const courseSectionSchema = z.object({
  title: titleField,
});

export const courseLessonSchema = z.object({
  title: titleField,
});

export const courseSubLessonSchema = z.object({
  title: titleField,
  kind: z.enum(["VIDEO", "QUIZ", "TEXT"], {
    message: "validation.subLessonKind",
  }),
});

export const courseQuizOptionSchema = z.object({
  prompt: z
    .string({ message: "validation.quizPrompt" })
    .trim()
    .min(1, { message: "validation.quizPrompt" }),
  options: z
    .array(
      z.object({
        body: z
          .string({ message: "validation.quizOptionBody" })
          .trim()
          .min(1, { message: "validation.quizOptionBody" }),
      }),
    )
    .min(1, { message: "validation.quizOptionsMin" }),
});

export const courseCollaboratorSchema = z.object({
  user_id: z
    .string({ message: "validation.collaboratorUserId" })
    .min(1, { message: "validation.collaboratorUserId" })
    .uuid({ message: "validation.collaboratorUserId" }),
});

export const courseRejectReasonSchema = z.object({
  reason: z
    .string({ message: "validation.rejectReason" })
    .trim()
    .min(1, { message: "validation.rejectReason" })
    .max(2000, { message: "validation.rejectReasonMax" }),
});

export type CourseCreateValues = z.infer<typeof courseCreateSchema>;
export type CourseBasicInfoValues = z.infer<typeof courseBasicInfoSchema>;
export type CourseSectionValues = z.infer<typeof courseSectionSchema>;
export type CourseLessonValues = z.infer<typeof courseLessonSchema>;
export type CourseSubLessonValues = z.infer<typeof courseSubLessonSchema>;
export type CourseCollaboratorValues = z.infer<typeof courseCollaboratorSchema>;
export type CourseRejectReasonValues = z.infer<typeof courseRejectReasonSchema>;
