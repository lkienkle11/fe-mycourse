"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteInstructorApplicationService } from "@/api/callers/instructor";
import { useInstructorApplicationsList } from "@/api/hooks/instructor";
import {
  InstructorApprovalActions,
  InstructorProfileViewDialog,
} from "@/components/features/instructor";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
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
import { InstructorListPagination } from "./instructor-list-pagination";

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
  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{tc("loading")}</p>
      ) : (
        <DataTable
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
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(row);
                  setProfileOpen(true);
                }}
              >
                {t("viewProfile")}
              </Button>
              <InstructorApprovalActions
                application={row}
                compact
                onSuccess={async () => {
                  await mutate();
                }}
              />
              <PermissionGate
                permissions={[PERMISSIONS.InstructorApplicationDelete]}
              >
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteTarget(row);
                    setDeleteOpen(true);
                  }}
                >
                  {tc("delete")}
                </Button>
              </PermissionGate>
            </div>
          )}
        />
      )}

      <InstructorListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => setFilters((prev) => ({ ...prev, page: next }))}
        previousLabel={tc("previous")}
        nextLabel={tc("next")}
        pageOfLabel={tc("pageOf", {
          page: String(page),
          totalPages: String(totalPages),
        })}
      />

      <InstructorProfileViewDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={selected?.profile ?? null}
        fullName={selected?.full_name}
        avatarUrl={selected?.avatar}
        title={t("profileTitle", { id: String(selected?.id ?? "") })}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
      />
    </div>
  );
}
