"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  addCourseCollaboratorsBulkService,
  removeCourseCollaboratorService,
} from "@/api/callers/course";
import { toastApiError } from "@/lib/utils/api-error";
import { finalizeBulkUserPickerSubmit } from "@/lib/utils/user-picker-bulk-submit";
import type { CourseCollaborator } from "@/types/course";

type UseCourseCollaboratorActionsParams = {
  courseId: string;
  setIsSubmittingCollaborator: (value: boolean) => void;
};

export function useCourseCollaboratorActions({
  courseId,
  setIsSubmittingCollaborator,
}: UseCourseCollaboratorActionsParams) {
  const t = useTranslations("course.editor.toast");
  const tErrors = useTranslations("errors.codes");

  const handleAddCollaborators = async (userIds: string[]) => {
    setIsSubmittingCollaborator(true);
    try {
      return await finalizeBulkUserPickerSubmit<CourseCollaborator>({
        userIds,
        submit: (ids) =>
          addCourseCollaboratorsBulkService(courseId, {
            user_ids: ids,
            role: "EDITOR",
          }),
        mapSucceededIds: (added) => added.map((c) => c.user_id),
        toasts: {
          onSuccess: () => toast.success(t("collaboratorAdded")),
          onAllFailed: () => toast.error(t("collaboratorAddAllFailed")),
          onPartialSuccess: (succeeded, failed) =>
            toast.warning(
              t("collaboratorAddPartialSuccess", {
                succeeded: String(succeeded),
                failed: String(failed),
              }),
            ),
          onApiError: (error) => toastApiError(tErrors, error),
        },
      });
    } finally {
      setIsSubmittingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator: CourseCollaborator) => {
    try {
      await removeCourseCollaboratorService(courseId, collaborator.user_id);
      toast.success(t("collaboratorRemoved"));
    } catch (error) {
      toastApiError(tErrors, error);
      throw error;
    }
  };

  return {
    handleAddCollaborators,
    handleRemoveCollaborator,
  };
}
