"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { createCourseService } from "@/api/callers/course";
import { extractRecommendedSlug, toastApiError } from "@/lib/utils/api-error";
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
 * `suggestedSlug` for a confirm dialog instead of an error toast.
 */
export function useCourseCreateFlow({ onCreated }: UseCourseCreateFlowParams) {
  const t = useTranslations("course.list");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setSlug("");
    setSuggestedSlug(null);
  };

  const submit = async (slugOverride?: string) => {
    const nextSlug = slugOverride ?? slug;
    const parsed = courseCreateSchema.safeParse({
      title: title.trim(),
      slug: nextSlug.trim(),
    });
    if (!parsed.success) {
      setSuggestedSlug(null);
      toastValidationError(tValidation, parsed.error.issues, "title");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createCourseService(
        toCreateCoursePayload(title, nextSlug),
      );
      toast.success(t("toast.created"));
      reset();
      await onCreated(created);
    } catch (error) {
      const recommendedSlug = extractRecommendedSlug(error);
      if (recommendedSlug) {
        setSuggestedSlug(recommendedSlug);
      } else {
        setSuggestedSlug(null);
        toastApiError(tErrors, error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!suggestedSlug) {
      return;
    }
    setSlug(suggestedSlug);
    await submit(suggestedSlug);
  };

  const dismissSuggestion = () => setSuggestedSlug(null);

  return {
    title,
    setTitle,
    slug,
    setSlug,
    isSubmitting,
    suggestedSlug,
    submit,
    acceptSuggestion,
    dismissSuggestion,
    reset,
  };
}
