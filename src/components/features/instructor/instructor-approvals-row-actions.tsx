"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  approveInstructorApplicationService,
  rejectInstructorApplicationService,
} from "@/api/callers/instructor";
import { CourseAdminTableActionsMenu } from "@/components/features/course/course-admin-table-actions-menu";
import { DeferredDropdownMenuItem } from "@/components/shared/deferred-dropdown-menu-item";
import { PermissionGate } from "@/components/shared/permission-gate";
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
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/constants/permissions";
import { isInstructorApplicantEligibleForReview } from "@/lib/instructor-application/applicant-eligibility";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import { instructorRejectionReasonSchema } from "@/schema/instructor";
import type { InstructorApplication } from "@/types/instructor";

const REJECTION_MIN = 1;
const REJECTION_MAX = 2000;

export type InstructorApprovalsRowActionsProps = {
  application: InstructorApplication;
  disabled?: boolean;
  onView: () => void;
  onDelete: () => void;
  onSuccess?: () => void | Promise<void>;
};

export function InstructorApprovalsRowActions({
  application,
  disabled = false,
  onView,
  onDelete,
  onSuccess,
}: InstructorApprovalsRowActionsProps) {
  const t = useTranslations("instructor.approvals");
  const tc = useTranslations("instructor.common");
  const tValidation = useTranslations("instructor.validation");
  const tErrors = useTranslations("errors.codes");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const isActionable =
    application.review_status === "pending" ||
    application.review_status === "returned";
  const canReview =
    isActionable && isInstructorApplicantEligibleForReview(application);
  const reasonLength = reason.trim().length;
  const reasonValid =
    reasonLength >= REJECTION_MIN && reasonLength <= REJECTION_MAX;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveInstructorApplicationService(application.id);
      toast.success(t("approveSuccess"));
      await onSuccess?.();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const parsed = instructorRejectionReasonSchema.safeParse({
      reason: reason.trim(),
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "rejectionReason");
      return;
    }
    setIsRejecting(true);
    try {
      await rejectInstructorApplicationService(application.id, {
        rejection_reason: reason.trim(),
      });
      toast.success(t("rejectSuccess"));
      setRejectOpen(false);
      setReason("");
      await onSuccess?.();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsRejecting(false);
    }
  };

  const busy = disabled || isApproving || isRejecting;

  return (
    <>
      <CourseAdminTableActionsMenu
        menuLabel={tc("actionsMenu")}
        disabled={busy}
      >
        <DeferredDropdownMenuItem onAction={onView}>
          {t("viewProfile")}
        </DeferredDropdownMenuItem>
        {canReview ? (
          <PermissionGate
            permissions={[PERMISSIONS.InstructorApplicationApprove]}
          >
            <DeferredDropdownMenuItem onAction={() => void handleApprove()}>
              {isApproving ? t("approving") : t("approve")}
            </DeferredDropdownMenuItem>
          </PermissionGate>
        ) : null}
        {canReview ? (
          <PermissionGate
            permissions={[PERMISSIONS.InstructorApplicationReject]}
          >
            <DeferredDropdownMenuItem
              variant="destructive"
              onAction={() => setRejectOpen(true)}
            >
              {t("reject")}
            </DeferredDropdownMenuItem>
          </PermissionGate>
        ) : null}
        <PermissionGate permissions={[PERMISSIONS.InstructorApplicationDelete]}>
          <DeferredDropdownMenuItem variant="destructive" onAction={onDelete}>
            {tc("delete")}
          </DeferredDropdownMenuItem>
        </PermissionGate>
      </CourseAdminTableActionsMenu>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <RequiredLabel htmlFor="rejection-reason">
              {t("rejectReasonLabel")}
            </RequiredLabel>
            <Textarea
              id="rejection-reason"
              value={reason}
              rows={5}
              maxLength={REJECTION_MAX}
              placeholder={t("rejectReasonPlaceholder")}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("rejectReasonHint", {
                min: String(REJECTION_MIN),
                max: String(REJECTION_MAX),
                count: String(reasonLength),
              })}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => setRejectOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isRejecting || !reasonValid}
              onClick={() => void handleReject()}
            >
              {isRejecting ? t("rejecting") : t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
