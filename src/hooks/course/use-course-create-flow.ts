"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { createCourseService } from "@/api/callers/course";
import { useSlugConflictFlow } from "@/hooks/slug";
import { toCreateCoursePayload } from "@/lib/utils/course";
import { toastValidationError } from "@/lib/utils/validation-message";
import { courseCreateSchema } from "@/schema/course";
import type { CourseDetail } from "@/types/course";

type UseCourseCreateFlowParams = {
  onCreated: (created: CourseDetail) => void | Promise<void>;
};

/**
 * Create-course dialog state. A blank slug is omitted so the backend
 * generates it; a slug conflict (3007) with a recommended slug is exposed as
 * `suggestedSlug` for a confirm dialog (shared `useSlugConflictFlow`).
 */
export function useCourseCreateFlow({ onCreated }: UseCourseCreateFlowParams) {
  const t = useTranslations("course.list");
  const tValidation = useTranslations("course.validation");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const clearForm = () => {
    setTitle("");
    setSlug("");
  };

  const flow = useSlugConflictFlow({
    slug,
    setSlug,
    prepare: (nextSlug) => {
      const parsed = courseCreateSchema.safeParse({
        title: title.trim(),
        slug: nextSlug.trim(),
      });
      if (!parsed.success) {
        toastValidationError(tValidation, parsed.error.issues, "title");
        return null;
      }
      return toCreateCoursePayload(title, nextSlug);
    },
    request: createCourseService,
    onSuccess: async (created) => {
      toast.success(t("toast.created"));
      clearForm();
      await onCreated(created);
    },
  });

  return {
    title,
    setTitle,
    slug,
    setSlug,
    isSubmitting: flow.isSubmitting,
    suggestedSlug: flow.suggestedSlug,
    submit: flow.submit,
    acceptSuggestion: flow.acceptSuggestion,
    dismissSuggestion: flow.dismissSuggestion,
    reset: () => {
      clearForm();
      flow.dismissSuggestion();
    },
  };
}
