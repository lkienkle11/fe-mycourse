"use client";

import { ConfirmActionDialog } from "./confirm-action-dialog";

export type SlugConflictConfirmDialogProps = {
  /** Server-recommended slug awaiting confirmation; the dialog is open while set. */
  suggestedSlug: string | null;
  isSubmitting: boolean;
  onAccept: () => void | Promise<void>;
  onDismiss: () => void;
  /** Already interpolated by the caller (namespaces differ per domain). */
  labels: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
    loading: string;
  };
};

/**
 * "Use the recommended slug?" confirm for `useSlugConflictFlow`. Render it
 * inside the parent dialog's content: it uses the `stacked` variant.
 */
export function SlugConflictConfirmDialog({
  suggestedSlug,
  isSubmitting,
  onAccept,
  onDismiss,
  labels,
}: SlugConflictConfirmDialogProps) {
  return (
    <ConfirmActionDialog
      stacked
      open={suggestedSlug !== null}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
      onConfirm={onAccept}
      title={labels.title}
      description={labels.description}
      confirmLabel={labels.confirm}
      cancelLabel={labels.cancel}
      isLoading={isSubmitting}
      loadingLabel={labels.loading}
    />
  );
}
