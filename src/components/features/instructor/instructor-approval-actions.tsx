"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  approveInstructorApplicationService,
  rejectInstructorApplicationService,
} from "@/api/callers/instructor";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/constants/permissions";
import type { InstructorApplication } from "@/types/instructor";

const REJECTION_MIN = 1;
const REJECTION_MAX = 2000;

export type InstructorApprovalActionsProps = {
  application: InstructorApplication;
  onSuccess?: () => void | Promise<void>;
  compact?: boolean;
};

export function InstructorApprovalActions({
  application,
  onSuccess,
  compact = false,
}: InstructorApprovalActionsProps) {
  const t = useTranslations("instructor.approvals");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const isPending = application.review_status === "pending";
  const reasonLength = reason.trim().length;
  const reasonValid =
    reasonLength >= REJECTION_MIN && reasonLength <= REJECTION_MAX;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveInstructorApplicationService(application.id);
      toast.success(t("approveSuccess"));
      await onSuccess?.();
    } catch {
      toast.error(t("errorGeneric"));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!reasonValid) return;
    setIsRejecting(true);
    try {
      await rejectInstructorApplicationService(application.id, {
        rejection_reason: reason.trim(),
      });
      toast.success(t("rejectSuccess"));
      setRejectOpen(false);
      setReason("");
      await onSuccess?.();
    } catch {
      toast.error(t("errorGeneric"));
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isPending) return null;

  const buttonSize = compact ? "sm" : "default";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <PermissionGate
          permissions={[PERMISSIONS.InstructorApplicationApprove]}
        >
          <Button
            type="button"
            size={buttonSize}
            disabled={isApproving}
            onClick={() => void handleApprove()}
          >
            {isApproving ? t("approving") : t("approve")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.InstructorApplicationReject]}>
          <Button
            type="button"
            size={buttonSize}
            variant="destructive"
            disabled={isRejecting}
            onClick={() => setRejectOpen(true)}
          >
            {t("reject")}
          </Button>
        </PermissionGate>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rejection-reason">{t("rejectReasonLabel")}</Label>
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
