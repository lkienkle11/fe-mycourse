"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DeltaEditorLinkDialogLabels = {
  title: string;
  urlLabel: string;
  urlPlaceholder: string;
  apply: string;
  remove: string;
  cancel: string;
};

type LinkDialogBodyProps = {
  initialUrl: string;
  labels: DeltaEditorLinkDialogLabels;
  onApply: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
};

function LinkDialogBody({
  initialUrl,
  labels,
  onApply,
  onRemove,
  onCancel,
}: LinkDialogBodyProps) {
  const inputId = useId();
  const [url, setUrl] = useState(initialUrl);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor={inputId}>{labels.urlLabel}</Label>
        <Input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          autoFocus
          placeholder={labels.urlPlaceholder}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onApply(url);
            }
          }}
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        {initialUrl ? (
          <Button type="button" variant="ghost" onClick={onRemove}>
            {labels.remove}
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button type="button" onClick={() => onApply(url)}>
          {labels.apply}
        </Button>
      </DialogFooter>
    </>
  );
}

type DeltaEditorLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  labels: DeltaEditorLinkDialogLabels;
  onApply: (url: string) => void;
  onRemove: () => void;
};

export function DeltaEditorLinkDialog({
  open,
  onOpenChange,
  initialUrl,
  labels,
  onApply,
  onRemove,
}: DeltaEditorLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <LinkDialogBody
            key={initialUrl}
            initialUrl={initialUrl}
            labels={labels}
            onApply={onApply}
            onRemove={onRemove}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
