"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  approveCourseReviewService,
  rejectCourseReviewService,
} from "@/api/callers/course";
import { useCourseReviewQueue } from "@/api/hooks/course";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
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
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () => [
      {
        id: "title",
        header: t("columns.course"),
        cell: (row) => (
          <div className="space-y-1">
            <div className="font-medium">{row.title || row.slug}</div>
            <div className="text-xs text-muted-foreground">/{row.slug}</div>
          </div>
        ),
      },
      {
        id: "owner",
        header: t("columns.owner"),
        cell: (row) => row.owner_user_id,
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => <CourseStatusBadge status={row.review_status} />,
      },
    ],
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
      toast.error(tValidation("rejectReason"));
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
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {scope === "admin" ? t("title.admin") : t("title.sysadmin")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          actionsHeader={tCommon("actions")}
          emptyMessage={t("empty")}
          renderActions={(row) => (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pendingActionId === row.id}
                onClick={() => void handleApprove(row)}
              >
                {t("approve")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pendingActionId === row.id}
                onClick={() => setRejectTarget(row)}
              >
                {t("reject")}
              </Button>
            </div>
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
          <Textarea
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
