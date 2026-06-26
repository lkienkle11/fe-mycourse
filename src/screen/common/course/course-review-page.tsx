"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  approveCourseReviewService,
  rejectCourseReviewService,
} from "@/api/callers/course";
import { useCourseReviewQueue } from "@/api/hooks/course";
import { buildCourseAdminListColumns } from "@/components/features/course/course-admin-list-columns";
import { CourseReviewRowActions } from "@/components/features/course/course-review-row-actions";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  courseApproveFeedbackSchema,
  courseRejectReasonSchema,
} from "@/schema/course";
import type { CourseListItem } from "@/types/course";

const FEEDBACK_MIN = 5;
const FEEDBACK_MAX = 500;

export function CourseReviewPage({ scope }: { scope: "admin" | "sysadmin" }) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.review");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const { rows, isLoading, mutate } = useCourseReviewQueue();
  const [approveTarget, setApproveTarget] = useState<CourseListItem | null>(
    null,
  );
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectTarget, setRejectTarget] = useState<CourseListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const approvalLength = approvalNote.trim().length;
  const approvalValid =
    approvalLength >= FEEDBACK_MIN && approvalLength <= FEEDBACK_MAX;
  const rejectionLength = rejectionReason.trim().length;
  const rejectionValid =
    rejectionLength >= FEEDBACK_MIN && rejectionLength <= FEEDBACK_MAX;

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () =>
      buildCourseAdminListColumns({
        course: t("columns.course"),
        owner: t("columns.owner"),
        version: t("columns.version"),
      }),
    [t],
  );

  const handleApprove = async () => {
    if (!approveTarget) {
      return;
    }
    const parsed = courseApproveFeedbackSchema.safeParse({
      approval_note: approvalNote.trim(),
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "approveFeedback");
      return;
    }
    setPendingActionId(approveTarget.id);
    try {
      await approveCourseReviewService(approveTarget.id, parsed.data);
      toast.success(t("toast.approved"));
      setApproveTarget(null);
      setApprovalNote("");
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) {
      return;
    }
    const parsed = courseRejectReasonSchema.safeParse({
      reason: rejectionReason.trim(),
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "rejectReason");
      return;
    }
    setPendingActionId(rejectTarget.id);
    try {
      await rejectCourseReviewService(rejectTarget.id, {
        reason: rejectionReason.trim(),
      });
      toast.success(t("toast.rejected"));
      setRejectTarget(null);
      setRejectionReason("");
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          actionsHeader={t("actions.menu")}
          emptyMessage={t("empty")}
          renderActions={(row) => (
            <CourseReviewRowActions
              scope={scope}
              course={row}
              disabled={pendingActionId === row.id}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          )}
        />
      )}

      <Dialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setApproveTarget(null);
            setApprovalNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approveDialog.title")}</DialogTitle>
          </DialogHeader>
          <RequiredLabel htmlFor="approve-feedback">
            {t("approveDialog.label")}
          </RequiredLabel>
          <Textarea
            id="approve-feedback"
            rows={5}
            maxLength={FEEDBACK_MAX}
            value={approvalNote}
            placeholder={t("approveDialog.placeholder")}
            onChange={(event) => setApprovalNote(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("approveDialog.hint", {
              min: String(FEEDBACK_MIN),
              max: String(FEEDBACK_MAX),
              count: String(approvalLength),
            })}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApproveTarget(null);
                setApprovalNote("");
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              disabled={!approvalValid || pendingActionId != null}
              onClick={() => void handleApprove()}
            >
              {t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectDialog.title")}</DialogTitle>
          </DialogHeader>
          <RequiredLabel htmlFor="reject-reason">
            {t("rejectDialog.label")}
          </RequiredLabel>
          <Textarea
            id="reject-reason"
            rows={5}
            maxLength={FEEDBACK_MAX}
            value={rejectionReason}
            placeholder={t("rejectDialog.placeholder")}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("rejectDialog.hint", {
              min: String(FEEDBACK_MIN),
              max: String(FEEDBACK_MAX),
              count: String(rejectionLength),
            })}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!rejectionValid || pendingActionId != null}
              onClick={() => void handleReject()}
            >
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
