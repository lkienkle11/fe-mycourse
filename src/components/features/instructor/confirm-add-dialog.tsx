"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toastValidationError } from "@/lib/utils/validation-message";
import { instructorEmailSchema } from "@/schema/instructor";

export type ConfirmAddInstructorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (email: string) => void | Promise<void>;
  isLoading?: boolean;
};

export function ConfirmAddInstructorDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ConfirmAddInstructorDialogProps) {
  const t = useTranslations("instructor.roster.add");
  const tValidation = useTranslations("instructor.validation");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim();
    const parsed = instructorEmailSchema.safeParse({ email: trimmed });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "email");
      return;
    }
    await onConfirm(trimmed);
    setEmail("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEmail("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <RequiredLabel htmlFor="instructor-email">
            {t("emailLabel")}
          </RequiredLabel>
          <Input
            id="instructor-email"
            type="email"
            value={email}
            placeholder={t("emailPlaceholder")}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isLoading || !email.trim()}
            onClick={() => void handleSubmit()}
          >
            {isLoading ? t("submitting") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
