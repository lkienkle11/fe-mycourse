"use client";

import { useTranslations } from "next-intl";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";

export type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  title?: string;
  description?: string;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title,
  description,
}: ConfirmDeleteDialogProps) {
  const t = useTranslations("taxonomy.delete");

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={title ?? t("title")}
      description={description ?? t("description")}
      cancelLabel={t("cancel")}
      confirmLabel={t("confirm")}
    />
  );
}
