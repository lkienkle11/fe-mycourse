"use client";

import { FileText, MoreVertical, Pencil, Trash2, Video } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatMediaDate, isImageMedia } from "@/lib/utils/media";
import type { MediaFile } from "@/types/media";

export type MediaItemCardProps = {
  file: MediaFile;
  selected?: boolean;
  selectionMode?: "single" | "none";
  onSelect?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
  canDelete?: boolean;
};

const cardClassName = (selectable: boolean, selected: boolean) =>
  cn(
    "relative flex w-full flex-col overflow-hidden rounded-lg border bg-card text-left",
    selectable && "cursor-pointer hover:border-primary",
    selected && "ring-2 ring-primary",
  );

export function MediaItemCard({
  file,
  selected = false,
  selectionMode = "none",
  onSelect,
  onDelete,
  canDelete = false,
}: MediaItemCardProps) {
  const t = useTranslations("media.item");
  const isImage = isImageMedia(file);
  const previewUrl = isImage ? file.url : file.thumbnail_url;
  const selectable = selectionMode === "single";

  const handleSelect = () => {
    if (selectable && onSelect) {
      onSelect(file);
    }
  };

  const body = (
    <>
      <div className="relative aspect-video w-full bg-muted">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={file.filename ?? t("untitled")}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <Empty className="h-full min-h-0 border-0 p-2">
            <EmptyMedia variant="icon">
              {file.kind === "VIDEO" ? (
                <Video className="size-5" />
              ) : (
                <FileText className="size-5" />
              )}
            </EmptyMedia>
            <EmptyTitle className="text-xs">{t("noPreview")}</EmptyTitle>
            <EmptyDescription className="text-xs">
              {file.filename}
            </EmptyDescription>
          </Empty>
        )}
        {canDelete ? (
          <div className="absolute top-1 right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-7"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled title={t("renameComingSoon")}>
                  <Pencil className="mr-2 size-4" />
                  {t("rename")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(file)}
                >
                  <Trash2 className="mr-2 size-4" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-sm font-medium" title={file.filename}>
          {file.filename ?? t("untitled")}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMediaDate(file.created_at)}
        </p>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={cardClassName(true, selected)}
        onClick={handleSelect}
      >
        {body}
      </button>
    );
  }

  return <div className={cardClassName(false, selected)}>{body}</div>;
}
