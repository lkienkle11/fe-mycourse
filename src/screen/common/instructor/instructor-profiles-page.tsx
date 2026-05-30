"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteInstructorProfileService } from "@/api/callers/instructor";
import { useInstructorProfilesList } from "@/api/hooks/instructor";
import { InstructorProfileViewDialog } from "@/components/features/instructor";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/constants/permissions";
import type {
  InstructorListFilters,
  InstructorProfile,
} from "@/types/instructor";
import { InstructorListPagination } from "./instructor-list-pagination";

export function InstructorProfilesPage() {
  const t = useTranslations("instructor.profiles");
  const tc = useTranslations("instructor.common");
  const [filters, setFilters] = useState<InstructorListFilters>({
    page: 1,
    per_page: 20,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<InstructorProfile | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstructorProfile | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorProfilesList(filters);
  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

  const columns = useMemo<DataTableColumn<InstructorProfile>[]>(
    () => [
      { id: "id", header: t("columns.id"), cell: (row) => row.id },
      {
        id: "user_id",
        header: t("columns.userId"),
        cell: (row) => row.user_id,
      },
      {
        id: "headline",
        header: t("columns.headline"),
        cell: (row) => row.profile.headline || "—",
      },
    ],
    [t],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteInstructorProfileService(deleteTarget.user_id);
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
          renderActions={(row) => (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(row);
                  setProfileOpen(true);
                }}
              >
                {t("view")}
              </Button>
              <PermissionGate
                permissions={[PERMISSIONS.InstructorProfileDelete]}
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
        title={t("profileTitle", { id: String(selected?.user_id ?? "") })}
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
