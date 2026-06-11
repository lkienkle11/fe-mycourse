"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { deleteMediaFile, uploadMediaFiles } from "@/api/callers/media";
import { PERMISSIONS } from "@/constants/permissions";
import { useSatisfiesPermissions } from "@/hooks/auth";
import { toastApiError } from "@/lib/utils/api-error";
import type { DeltaMediaEmbedRef, MediaEmbedKind } from "@/lib/utils/media";
import { validateMediaUploadBatch } from "@/lib/utils/media";
import type { MediaFile } from "@/types/media";

/** Shared upload/delete callbacks for `DeltaEditor` paste, drop, and embed removal. */
export function useDeltaEditorMediaHandlers() {
  const t = useTranslations("course.editor.deltaEditor");
  const tValidation = useTranslations("media.validation");
  const tErrors = useTranslations("errors.codes");
  const canUploadMedia = useSatisfiesPermissions({
    permissions: [PERMISSIONS.MediaFileCreate],
  });
  const canDeleteMedia = useSatisfiesPermissions({
    permissions: [PERMISSIONS.MediaFileDelete],
  });

  const onObjectEmbedded = useCallback(
    async (file: File, kind: MediaEmbedKind): Promise<MediaFile | null> => {
      if (!canUploadMedia) {
        toast.error(t("uploadNoPermission"));
        return null;
      }

      const issue = validateMediaUploadBatch([file], kind);
      if (issue) {
        toast.error(tValidation(issue.messageKey));
        return null;
      }

      try {
        const uploaded = await uploadMediaFiles([file]);
        return uploaded[0] ?? null;
      } catch (error) {
        toastApiError(tErrors, error);
        return null;
      }
    },
    [canUploadMedia, t, tErrors, tValidation],
  );

  const onDelete = useCallback(
    async (embed: DeltaMediaEmbedRef) => {
      if (!canDeleteMedia) {
        return;
      }

      if (!embed.object_key) {
        return;
      }

      try {
        await deleteMediaFile(embed.object_key);
      } catch (error) {
        toastApiError(tErrors, error);
      }
    },
    [canDeleteMedia, tErrors],
  );

  return { onObjectEmbedded, onDelete };
}
