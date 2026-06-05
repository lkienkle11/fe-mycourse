"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { MediaCollectionDialog } from "@/components/features/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MediaFile } from "@/types/media";

type DeltaOp = {
  insert: string | { image: string };
  attributes?: Record<string, unknown>;
};

type DeltaShape = {
  ops: DeltaOp[];
};

function parseDelta(value: string): DeltaShape {
  try {
    const parsed = JSON.parse(value) as DeltaShape;
    if (parsed && Array.isArray(parsed.ops)) {
      return parsed;
    }
  } catch {}
  return { ops: [{ insert: "" }] };
}

function stringifyDelta(delta: DeltaShape): string {
  return JSON.stringify(delta, null, 2);
}

function extractPlainText(delta: DeltaShape): string {
  return delta.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
}

function extractImages(delta: DeltaShape): string[] {
  return delta.ops
    .map((op) =>
      typeof op.insert === "object" && op.insert && "image" in op.insert
        ? op.insert.image
        : "",
    )
    .filter(Boolean);
}

export type CourseDeltaEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CourseDeltaEditor({ value, onChange }: CourseDeltaEditorProps) {
  const t = useTranslations("course.editor.deltaEditor");
  const delta = useMemo(() => parseDelta(value), [value]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const plainText = extractPlainText(delta);
  const images = extractImages(delta);

  const updateText = (nextText: string) => {
    const nextDelta: DeltaShape = { ops: [{ insert: nextText }] };
    const imageOps = delta.ops.filter(
      (op) =>
        typeof op.insert === "object" && op.insert && "image" in op.insert,
    );
    nextDelta.ops.push(...imageOps);
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
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      return;
    }
    const nextDelta: DeltaShape = {
      ops: [
        ...delta.ops,
        {
          insert: trimmed,
          attributes: { link: trimmed },
        },
        { insert: "\n" },
      ],
    };
    onChange(stringifyDelta(nextDelta));
    setLinkUrl("");
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
              onChange={(event) => setLinkUrl(event.target.value)}
            />
            <Button type="button" variant="secondary" onClick={appendLink}>
              {t("addLink")}
            </Button>
          </div>
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
