import type { LucideIcon } from "lucide-react";
import { FileText, ListChecks, Video } from "lucide-react";
import type { CourseSubLessonKind } from "@/types/course";

/** Outline + editor icons for each curriculum sub-lesson content kind. */
export const SUB_LESSON_KIND_ICONS = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: ListChecks,
} as const satisfies Record<CourseSubLessonKind, LucideIcon>;
