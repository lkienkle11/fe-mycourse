"use client";

import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadMediaFiles } from "@/api/callers/media";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEDIA_TAB_ACCEPT } from "@/constants/media/file-rules";
import { PERMISSIONS } from "@/constants/permissions";
import { formatBytes } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import { validateMediaUploadBatch } from "@/lib/utils/media";
import type { MediaTab } from "@/types/media";

export type MediaUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: MediaTab;
  onUploaded: () => void | Promise<void>;
  /** When set, overrides tab default accept + validates extensions on add/upload. */
  allowedExtensions?: readonly string[];
};

export function MediaUploadDialog({
  open,
  onOpenChange,
  tab,
  onUploaded,
  allowedExtensions,
}: MediaUploadDialogProps) {
  const t = useTranslations("media.upload");
  const tValidation = useTranslations("media.validation");
  const tErrors = useTranslations("errors.codes");
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  const reset = useCallback(() => {
    setFiles([]);
    setIsDragging(false);
  }, []);

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files, ...Array.from(incoming)];
    const issue = validateMediaUploadBatch(next, tab, allowedExtensions);
    if (issue) {
      toast.error(tValidation(issue.messageKey));
      return;
    }
    setFiles(next);
  };

  const handleUpload = async () => {
    const issue = validateMediaUploadBatch(files, tab, allowedExtensions);
    if (issue) {
      toast.error(tValidation(issue.messageKey));
      return;
    }
    setIsUploading(true);
    try {
      await uploadMediaFiles(files);
      toast.success(t("success"));
      reset();
      onOpenChange(false);
      await onUploaded();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsUploading(false);
    }
  };

  const accept =
    allowedExtensions?.length && allowedExtensions.length > 0
      ? allowedExtensions.join(",")
      : MEDIA_TAB_ACCEPT[tab];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`title.${tab}`)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <PermissionGate permissions={[PERMISSIONS.MediaFileCreate]}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop upload zone */}
          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-muted/50"
                : "border-muted-foreground/30"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (event.dataTransfer.files.length) {
                addFiles(event.dataTransfer.files);
              }
            }}
          >
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("dropHint")}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {t("chooseFiles")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) {
                  addFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("limits", { maxFiles: "5", maxSize: "2 GB" })}
            </p>
          </div>
        </PermissionGate>

        {files.length > 0 ? (
          <ul className="scrollbar-app max-h-48 space-y-2 overflow-y-auto">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
              >
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={isUploading}
                  onClick={() =>
                    setFiles((prev) =>
                      prev.filter(
                        (item) =>
                          item.name !== file.name ||
                          item.size !== file.size ||
                          item.lastModified !== file.lastModified,
                      ),
                    )
                  }
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {files.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("totalSize", { size: formatBytes(totalBytes) })}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            {t("cancel")}
          </Button>
          <PermissionGate permissions={[PERMISSIONS.MediaFileCreate]}>
            <Button
              type="button"
              disabled={files.length === 0 || isUploading}
              onClick={() => void handleUpload()}
            >
              {isUploading ? t("uploading") : t("upload")}
            </Button>
          </PermissionGate>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
