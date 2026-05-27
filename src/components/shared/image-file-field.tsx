"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PermissionName } from "@/types/permissions";

export type ImageFileFieldProps = {
  label: string;
  hint: string;
  browseLabel: string;
  clearLabel: string;
  previewAlt: string;
  noImageSelectedLabel: string;
  imageFileId?: string;
  previewUrl?: string;
  onBrowse: () => void;
  onClear: () => void;
  hiddenInput: ReactNode;
  browsePermissions?: PermissionName[];
};

export function ImageFileField({
  label,
  hint,
  browseLabel,
  clearLabel,
  previewAlt,
  noImageSelectedLabel,
  imageFileId,
  previewUrl,
  onBrowse,
  onClear,
  hiddenInput,
  browsePermissions,
}: ImageFileFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={previewAlt}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted-foreground">
              {imageFileId ? imageFileId.slice(0, 8) : noImageSelectedLabel}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {browsePermissions?.length ? (
            <PermissionGate permissions={browsePermissions}>
              <Button type="button" variant="secondary" onClick={onBrowse}>
                {browseLabel}
              </Button>
            </PermissionGate>
          ) : (
            <Button type="button" variant="secondary" onClick={onBrowse}>
              {browseLabel}
            </Button>
          )}
          {imageFileId ? (
            <Button type="button" variant="outline" onClick={onClear}>
              {clearLabel}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {hiddenInput}
    </div>
  );
}
