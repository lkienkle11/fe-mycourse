"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type {
  UserPickerLabels,
  UserPickerPaginationLabels,
} from "@/types/user-picker";

export function useInstructorRosterPickerLabels(): UserPickerLabels {
  const t = useTranslations("instructor.roster.picker");
  return useMemo(
    () => ({
      title: t("title"),
      description: t("description"),
      searchPlaceholder: t("searchPlaceholder"),
      searchAction: t("searchAction"),
      loading: t("loading"),
      empty: t("empty"),
      cancel: t("cancel"),
      addSelected: t("addSelected"),
      adding: t("adding"),
    }),
    [t],
  );
}

export function useCourseCollaboratorPickerLabels(): UserPickerLabels {
  const t = useTranslations("course.editor.collaborators.picker");
  return useMemo(
    () => ({
      title: t("title"),
      description: t("description"),
      searchPlaceholder: t("searchPlaceholder"),
      searchAction: t("searchAction"),
      loading: t("loading"),
      empty: t("empty"),
      cancel: t("cancel"),
      addSelected: t("addSelected"),
      adding: t("adding"),
    }),
    [t],
  );
}

export function useUserPickerPaginationLabels(): UserPickerPaginationLabels {
  const tc = useTranslations("instructor.common");
  return useMemo(
    () => ({
      previousLabel: tc("previous"),
      nextLabel: tc("next"),
      buildPageOfLabel: (currentPage, totalPages) =>
        tc("pageOf", {
          page: String(currentPage),
          totalPages: String(totalPages),
        }),
    }),
    [tc],
  );
}
