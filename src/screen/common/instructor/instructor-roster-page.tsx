"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorRosterBulkService,
  deleteInstructorRosterService,
  getInstructorProfileByUserService,
} from "@/api/callers/instructor";
import { useInstructorRosterList } from "@/api/hooks/instructor";
import { InstructorRosterPickerDialog } from "@/components/features/instructor";
import {
  buildInstructorPageFooterFromInfo,
  InstructorProfileDeleteActions,
  InstructorProfileDeleteFooter,
  InstructorTableSection,
} from "@/components/features/instructor/instructor-action-controls";
import type { DataTableColumn } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/constants/permissions";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { pickCharacter } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import type {
  InstructorListFilters,
  InstructorProfile,
  InstructorRosterMember,
} from "@/types/instructor";
import type { UserPickerConfirmResult } from "@/types/user-picker";

export function InstructorRosterPage() {
  const t = useTranslations("instructor.roster");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
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
  const headerActions = useMemo(
    () => (
      <PermissionGate permissions={[PERMISSIONS.InstructorRosterCreate]}>
        <Button type="button" onClick={() => setAddOpen(true)}>
          {t("addButton")}
        </Button>
      </PermissionGate>
    ),
    [t],
  );
  const headerOverride = useMemo(
    () => ({
      actions: headerActions,
    }),
    [headerActions],
  );

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorRosterList(filters);
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

  const handleAddInstructors = async (
    userIds: string[],
  ): Promise<UserPickerConfirmResult | undefined> => {
    if (userIds.length === 0) {
      return;
    }
    setIsAdding(true);
    try {
      const result = await addInstructorRosterBulkService({
        user_ids: userIds,
      });
      await mutate();

      const succeededCount = result.added.length;
      const failedCount = result.failed.length;

      if (failedCount === 0) {
        toast.success(t("addSuccess"));
        return;
      }

      if (succeededCount === 0) {
        toast.error(t("addAllFailed"));
        throw new Error("bulk roster add failed");
      }

      toast.warning(
        t("addPartialSuccess", {
          succeeded: String(succeededCount),
          failed: String(failedCount),
        }),
      );
      return {
        succeededIds: result.added.map((member) => member.id),
        failedCount,
      };
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== "bulk roster add failed"
      ) {
        toastApiError(tErrors, error);
      }
      throw error;
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
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };

  useRegisterDashboardPageHeader(headerOverride);

  return (
    <div className="flex flex-col gap-4">
      <InstructorTableSection
        isLoading={isLoading}
        loadingLabel={tc("loading")}
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
          <InstructorProfileDeleteActions
            viewLabel={t("viewProfile")}
            viewDisabled={isLoadingProfile}
            onView={() => void openProfile(row)}
            deletePermission={PERMISSIONS.InstructorRosterDelete}
            deleteLabel={tc("delete")}
            onDelete={() => {
              setDeleteTarget(row);
              setDeleteOpen(true);
            }}
          />
        )}
      />

      <InstructorProfileDeleteFooter
        {...footerProps}
        profileOpen={profileOpen}
        onProfileOpenChange={setProfileOpen}
        profile={selectedProfile?.profile ?? null}
        fullName={selectedProfile?.full_name}
        avatarUrl={selectedProfile?.avatar}
        profileTitle={profileTitle}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleteConfirm={handleDelete}
        isDeleting={isDeleting}
        deleteTitle={t("deleteTitle")}
        deleteDescription={t("deleteDescription", {
          name: deleteTarget?.full_name ?? "",
        })}
      >
        <InstructorRosterPickerDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onConfirm={handleAddInstructors}
          isSubmitting={isAdding}
        />
      </InstructorProfileDeleteFooter>
    </div>
  );
}
