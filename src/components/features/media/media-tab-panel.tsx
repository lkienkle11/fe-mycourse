"use client";

import { useTranslations } from "next-intl";
import { MediaItemCard } from "@/components/features/media/media-item-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaFile } from "@/types/media";

export type MediaTabPanelProps = {
  files: MediaFile[];
  isLoading: boolean;
  selectionMode?: "single" | "none";
  selectedId?: string;
  onSelect?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
  canDelete?: boolean;
};

export function MediaTabPanel({
  files,
  isLoading,
  selectionMode = "none",
  selectedId,
  onSelect,
  onDelete,
  canDelete = false,
}: MediaTabPanelProps) {
  const t = useTranslations("media.collection");

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {(["a", "b", "c", "d", "e", "f", "g", "h"] as const).map((id) => (
          <Skeleton key={id} className="aspect-[4/3] w-full" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {files.map((file) => (
        <MediaItemCard
          key={file.id ?? file.object_key}
          file={file}
          selectionMode={selectionMode}
          selected={selectedId != null && file.id === selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
