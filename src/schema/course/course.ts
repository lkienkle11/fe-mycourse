import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z
    .string({ message: "validation.title" })
    .min(1, { message: "validation.title" }),
});

export const courseSectionSchema = z.object({
  title: z
    .string({ message: "validation.sectionTitle" })
    .min(1, { message: "validation.sectionTitle" }),
});

export const courseLessonSchema = z.object({
  title: z
    .string({ message: "validation.lessonTitle" })
    .min(1, { message: "validation.lessonTitle" }),
});

export const courseSubLessonSchema = z.object({
  title: z
    .string({ message: "validation.subLessonTitle" })
    .min(1, { message: "validation.subLessonTitle" }),
  kind: z.enum(["VIDEO", "QUIZ", "TEXT"], {
    message: "validation.subLessonKind",
  }),
});

export const courseQuizOptionSchema = z.object({
  prompt: z
    .string({ message: "validation.quizPrompt" })
    .min(1, { message: "validation.quizPrompt" }),
});

export const courseCollaboratorSchema = z.object({
  user_id: z
    .string({ message: "validation.collaboratorUserId" })
    .min(1, { message: "validation.collaboratorUserId" }),
});

export const courseRejectReasonSchema = z.object({
  reason: z
    .string({ message: "validation.rejectReason" })
    .min(1, { message: "validation.rejectReason" }),
});

export type CourseCreateValues = z.infer<typeof courseCreateSchema>;
export type CourseSectionValues = z.infer<typeof courseSectionSchema>;
export type CourseLessonValues = z.infer<typeof courseLessonSchema>;
export type CourseSubLessonValues = z.infer<typeof courseSubLessonSchema>;
export type CourseCollaboratorValues = z.infer<typeof courseCollaboratorSchema>;
export type CourseRejectReasonValues = z.infer<typeof courseRejectReasonSchema>;
