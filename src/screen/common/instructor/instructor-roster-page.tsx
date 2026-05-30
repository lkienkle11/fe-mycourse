"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorRosterService,
  deleteInstructorRosterService,
  getInstructorProfileByUserService,
} from "@/api/callers/instructor";
import { useInstructorRosterList } from "@/api/hooks/instructor";
import {
  ConfirmAddInstructorDialog,
  InstructorProfileViewDialog,
} from "@/components/features/instructor";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/constants/permissions";
import { pickCharacter } from "@/lib/utils";
import type {
  InstructorListFilters,
  InstructorProfile,
  InstructorRosterMember,
} from "@/types/instructor";
import { InstructorListPagination } from "./instructor-list-pagination";

export function InstructorRosterPage() {
  const t = useTranslations("instructor.roster");
  const tc = useTranslations("instructor.common");
  const [filters, setFilters] = useState<InstructorListFilters>({
    page: 1,
    per_page: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<InstructorRosterMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<InstructorProfile | null>(null);
  const [profileTitle, setProfileTitle] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorRosterList(filters);
  const page = pageInfo?.page ?? filters.page ?? 1;
  const totalPages = pageInfo?.total_pages ?? 1;

  const columns = useMemo<DataTableColumn<InstructorRosterMember>[]>(
    () => [
      {
        id: "avatar",
        header: t("columns.avatar"),
        cell: (row) => {
          const { label, color, backgroundColor } = pickCharacter(
            row.full_name,
          );
          return row.avatar ? (
            <Image
              src={row.avatar}
              alt={`${row.full_name} avatar`}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex size-8 items-center justify-center rounded-full"
              style={{ backgroundColor }}
            >
              <span
                style={{ color }}
                className="text-xs font-semibold leading-none"
              >
                {label}
              </span>
            </div>
          );
        },
      },
      {
        id: "full_name",
        header: t("columns.name"),
        cell: (row) => row.full_name,
      },
      { id: "email", header: t("columns.email"), cell: (row) => row.email },
      { id: "phone", header: t("columns.phone"), cell: (row) => row.phone },
    ],
    [t],
  );

  const applySearch = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchInput.trim() || undefined,
    }));
  };

  const handleAdd = async (email: string) => {
    setIsAdding(true);
    try {
      await addInstructorRosterService({ email });
      toast.success(t("addSuccess"));
      setAddOpen(false);
      await mutate();
    } catch {
      toast.error(tc("errorGeneric"));
    } finally {
      setIsAdding(false);
    }
  };

  const openProfile = async (row: InstructorRosterMember) => {
    setIsLoadingProfile(true);
    try {
      const profile = await getInstructorProfileByUserService(row.id);
      setSelectedProfile(profile);
      setProfileTitle(row.full_name);
      setProfileOpen(true);
    } catch {
      toast.error(t("profileNotFound"));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteInstructorRosterService(deleteTarget.id);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <PermissionGate permissions={[PERMISSIONS.InstructorRosterCreate]}>
          <Button type="button" onClick={() => setAddOpen(true)}>
            {t("addButton")}
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{tc("loading")}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          actionsHeader={tc("actions")}
          emptyMessage={tc("empty")}
          searchValue={searchInput}
          searchPlaceholder={t("searchPlaceholder")}
          searchButtonLabel={tc("search")}
          onSearchValueChange={setSearchInput}
          onSearchSubmit={applySearch}
          renderActions={(row) => (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingProfile}
                onClick={() => void openProfile(row)}
              >
                {t("viewProfile")}
              </Button>
              <PermissionGate
                permissions={[PERMISSIONS.InstructorRosterDelete]}
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

      <ConfirmAddInstructorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onConfirm={handleAdd}
        isLoading={isAdding}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          name: deleteTarget?.full_name ?? "",
        })}
      />

      <InstructorProfileViewDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={selectedProfile?.profile ?? null}
        fullName={selectedProfile?.full_name}
        avatarUrl={selectedProfile?.avatar}
        title={profileTitle}
      />
    </div>
  );
}
