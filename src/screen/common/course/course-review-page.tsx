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
import { courseRejectReasonSchema } from "@/schema/course";
import type { CourseListItem } from "@/types/course";

export function CourseReviewPage({ scope }: { scope: "admin" | "sysadmin" }) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.review");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const { rows, isLoading, mutate } = useCourseReviewQueue();
  const [rejectTarget, setRejectTarget] = useState<CourseListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () =>
      buildCourseAdminListColumns(
        {
          course: t("columns.course"),
          owner: t("columns.owner"),
          version: t("columns.version"),
          status: t("columns.status"),
        },
        { includeStatus: true },
      ),
    [t],
  );

  const handleApprove = async (course: CourseListItem) => {
    setPendingActionId(course.id);
    try {
      await approveCourseReviewService(course.id);
      toast.success(t("toast.approved"));
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
              onApprove={handleApprove}
              onReject={setRejectTarget}
            />
          )}
        />
      )}

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
            {t("rejectDialog.placeholder")}
          </RequiredLabel>
          <Textarea
            id="reject-reason"
            rows={5}
            value={rejectionReason}
            placeholder={t("rejectDialog.placeholder")}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
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
              disabled={!rejectionReason.trim() || pendingActionId != null}
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
