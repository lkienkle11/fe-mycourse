"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { MediaCollectionDialog } from "@/components/features/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type DeltaShape,
  extractImageOps,
  extractImages,
  extractPlainText,
  normalizeSafeLink,
  parseDelta,
  stringifyDelta,
} from "@/lib/utils";
import type { MediaFile } from "@/types/media";

export type CourseDeltaEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CourseDeltaEditor({ value, onChange }: CourseDeltaEditorProps) {
  const t = useTranslations("course.editor.deltaEditor");
  const delta = useMemo(() => parseDelta(value), [value]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const plainText = extractPlainText(delta);
  const images = extractImages(delta);

  const updateText = (nextText: string) => {
    const nextDelta: DeltaShape = { ops: [{ insert: nextText }] };
    nextDelta.ops.push(...extractImageOps(delta));
    onChange(stringifyDelta(nextDelta));
  };

  const appendImage = (file: MediaFile) => {
    const nextDelta: DeltaShape = {
      ops: [
        ...delta.ops,
        { insert: "\n" },
        { insert: { image: file.url } },
        { insert: "\n" },
      ],
    };
    onChange(stringifyDelta(nextDelta));
  };

  const appendLink = () => {
    const normalizedLink = normalizeSafeLink(linkUrl);
    if (!normalizedLink) {
      if (linkUrl.trim()) {
        setLinkError(t("invalidLink"));
      }
      return;
    }

    const nextDelta: DeltaShape = {
      ops: [
        ...delta.ops,
        {
          insert: normalizedLink,
          attributes: { link: normalizedLink },
        },
        { insert: "\n" },
      ],
    };
    onChange(stringifyDelta(nextDelta));
    setLinkUrl("");
    setLinkError(null);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{t("lessonTextLabel")}</Label>
        <Textarea
          rows={8}
          value={plainText}
          onChange={(event) => updateText(event.target.value)}
          placeholder={t("lessonTextPlaceholder")}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label>{t("linkEmbedLabel")}</Label>
          <div className="flex gap-2">
            <Input
              value={linkUrl}
              placeholder={t("linkPlaceholder")}
              onChange={(event) => {
                setLinkUrl(event.target.value);
                if (linkError) {
                  setLinkError(null);
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={appendLink}>
              {t("addLink")}
            </Button>
          </div>
          {linkError ? (
            <p className="px-1 text-xs text-destructive">{linkError}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>{t("imagesLabel")}</Label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setImageDialogOpen(true)}
          >
            {t("insertImage")}
          </Button>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="space-y-2">
          <Label>{t("embeddedImagesLabel")}</Label>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {images.map((image) => (
              <li key={image} className="truncate">
                {image}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>{t("deltaJsonLabel")}</Label>
        <Textarea
          rows={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.raw("deltaPlaceholder")}
        />
      </div>

      <MediaCollectionDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        defaultTab="image"
        visibleTabs={["image"]}
        selectionMode="single"
        onSelect={(file) => appendImage(file)}
      />
    </div>
  );
}
