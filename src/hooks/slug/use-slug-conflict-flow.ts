"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { extractRecommendedSlug, toastApiError } from "@/lib/utils/api-error";

export type UseSlugConflictFlowParams<TPayload, TResult> = {
  /** Current slug text owned by the caller (local state or a form value). */
  slug: string;
  /** Writes the accepted recommended slug back into the caller's field. */
  setSlug: (slug: string) => void;
  /**
   * Validates and builds the request payload for `slug`. Return `null` after
   * surfacing the feedback (toast / field error); the request is then skipped.
   */
  prepare: (slug: string) => TPayload | null;
  request: (payload: TPayload) => Promise<TResult>;
  onSuccess: (result: TResult) => void | Promise<void>;
};

/**
 * Submit with an optional slug. A slug conflict (`SlugAlreadyExists`, 3007)
 * that carries `data.recommended_slug` is exposed as `suggestedSlug` for a
 * stacked confirm dialog instead of an error toast; accepting resubmits with
 * the recommendation (and repeats on a new conflict), dismissing clears it.
 * Any other error is shown with `toastApiError`.
 */
export function useSlugConflictFlow<TPayload, TResult>({
  slug,
  setSlug,
  prepare,
  request,
  onSuccess,
}: UseSlugConflictFlowParams<TPayload, TResult>) {
  const tErrors = useTranslations("errors.codes");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);

  const submit = async (slugOverride?: string) => {
    const payload = prepare(slugOverride ?? slug);
    if (payload === null) {
      setSuggestedSlug(null);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await request(payload);
      setSuggestedSlug(null);
      await onSuccess(result);
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
    isSubmitting,
    suggestedSlug,
    submit,
    acceptSuggestion,
    dismissSuggestion,
  };
}
