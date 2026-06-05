"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteInstructorApplicationService } from "@/api/callers/instructor";
import { useInstructorApplicationsList } from "@/api/hooks/instructor";
import { InstructorApprovalActions } from "@/components/features/instructor";
import {
  buildInstructorPageFooterFromInfo,
  InstructorProfileDeleteActions,
  InstructorProfileDeleteFooter,
  InstructorTableSection,
} from "@/components/features/instructor/instructor-action-controls";
import type { DataTableColumn } from "@/components/shared/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS } from "@/constants/permissions";
import type {
  InstructorApplication,
  InstructorListFilters,
  InstructorReviewStatus,
} from "@/types/instructor";

export function InstructorApprovalsPage() {
  const t = useTranslations("instructor.approvals");
  const tc = useTranslations("instructor.common");
  const [filters, setFilters] = useState<InstructorListFilters>({
    page: 1,
    per_page: 20,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<InstructorApplication | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<InstructorApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorApplicationsList(filters);
  const footerProps = buildInstructorPageFooterFromInfo(
    pageInfo,
    filters.page ?? 1,
    (next) => setFilters((prev) => ({ ...prev, page: next })),
    {
      previousLabel: tc("previous"),
      nextLabel: tc("next"),
      buildPageOfLabel: (page, totalPages) =>
        tc("pageOf", {
          page: String(page),
          totalPages: String(totalPages),
        }),
    },
  );

  const columns = useMemo<DataTableColumn<InstructorApplication>[]>(
    () => [
      { id: "id", header: t("columns.id"), cell: (row) => row.id },
      {
        id: "user_id",
        header: t("columns.userId"),
        cell: (row) => row.user_id,
      },
      {
        id: "review_status",
        header: t("columns.status"),
        cell: (row) => {
          const key = row.review_status as InstructorReviewStatus;
          return t(`status.${key}`);
        },
      },
    ],
    [t],
  );

  const statusFilter = (
    <Select
      value={filters.review_status ?? "ALL"}
      onValueChange={(value) => {
        setFilters((prev) => ({
          ...prev,
          page: 1,
          review_status:
            value === "ALL" ? undefined : (value as InstructorReviewStatus),
        }));
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("statusAll")}</SelectItem>
        <SelectItem value="pending">{t("status.pending")}</SelectItem>
        <SelectItem value="approved">{t("status.approved")}</SelectItem>
        <SelectItem value="rejected">{t("status.rejected")}</SelectItem>
      </SelectContent>
    </Select>
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteInstructorApplicationService(deleteTarget.id);
      toast.success(tc("deleteSuccess"));
      setDeleteOpen(false);
      setDeleteTarget(null);
      await mutate();
    } catch {
      toast.error(tc("errorGeneric"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <InstructorTableSection
        isLoading={isLoading}
        loadingLabel={tc("loading")}
        columns={columns}
        rows={rows}
        actionsHeader={tc("actions")}
        emptyMessage={tc("empty")}
        filterByOptions={[
          {
            value: "status",
            label: t("columns.status"),
            customInputComponent: statusFilter,
          },
        ]}
        selectedFilterBy="status"
        onFilterByChange={() => {}}
        filterByLabel={tc("filterBy")}
        renderActions={(row) => (
          <InstructorProfileDeleteActions
            direction="column"
            viewLabel={t("viewProfile")}
            onView={() => {
              setSelected(row);
              setProfileOpen(true);
            }}
            deletePermission={PERMISSIONS.InstructorApplicationDelete}
            deleteLabel={tc("delete")}
            onDelete={() => {
              setDeleteTarget(row);
              setDeleteOpen(true);
            }}
          >
            <InstructorApprovalActions
              application={row}
              compact
              onSuccess={async () => {
                await mutate();
              }}
            />
          </InstructorProfileDeleteActions>
        )}
      />

      <InstructorProfileDeleteFooter
        {...footerProps}
        profileOpen={profileOpen}
        onProfileOpenChange={setProfileOpen}
        profile={selected?.profile ?? null}
        fullName={selected?.full_name}
        avatarUrl={selected?.avatar}
        profileTitle={t("profileTitle", { id: String(selected?.id ?? "") })}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleteConfirm={handleDelete}
        isDeleting={isDeleting}
        deleteTitle={t("deleteTitle")}
        deleteDescription={t("deleteDescription")}
      />
    </div>
  );
}
