"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addInstructorRosterBulkService,
  deleteInstructorRosterService,
} from "@/api/callers/instructor";
import {
  useInstructorProfileDetail,
  useInstructorRosterList,
} from "@/api/hooks/instructor";
import {
  InstructorRosterPickerDialog,
  InstructorRosterRowActions,
} from "@/components/features/instructor";
import {
  buildInstructorPageFooterFromInfo,
  InstructorPageFooter,
  InstructorProfileAndDeleteDialogs,
  InstructorTableSection,
} from "@/components/features/instructor/instructor-action-controls";
import type { DataTableColumn } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/constants/permissions";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { useInstructorRosterPortfolioQuery } from "@/hooks/instructor/use-instructor-roster-portfolio-query";
import {
  mergeInstructorApplicationDetail,
  resolveInstructorApplicationProfile,
  resolveInstructorDisplayName,
} from "@/lib/instructor-application/helpers";
import { pickCharacter } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import { finalizeBulkUserPickerSubmit } from "@/lib/utils/user-picker-bulk-submit";
import type {
  InstructorListFilters,
  InstructorRosterMember,
} from "@/types/instructor";

export function InstructorRosterPage() {
  const t = useTranslations("instructor.roster");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
  const { portfolioId, rawPortfolioId, setPortfolioId } =
    useInstructorRosterPortfolioQuery();
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
  const handledInvalidPortfolioRef = useRef<string | null>(null);
  const handledFetchErrorRef = useRef<string | null>(null);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorRosterList(filters);
  const selectedMember = useMemo(
    () =>
      portfolioId ? (rows.find((row) => row.id === portfolioId) ?? null) : null,
    [portfolioId, rows],
  );
  const {
    data: detailProfile,
    isLoading: detailLoading,
    error,
  } = useInstructorProfileDetail(portfolioId, {
    onError: (fetchError) => {
      if (!portfolioId || handledFetchErrorRef.current === portfolioId) {
        return;
      }
      handledFetchErrorRef.current = portfolioId;
      toastApiError(tErrors, fetchError);
      setPortfolioId(null);
    },
  });
  const displayProfile = useMemo(
    () => mergeInstructorApplicationDetail(null, detailProfile),
    [detailProfile],
  );
  const applicantDisplayName =
    resolveInstructorDisplayName(displayProfile) ||
    selectedMember?.full_name ||
    "";
  const profileOpen = Boolean(portfolioId);

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

  useEffect(() => {
    if (!portfolioId) {
      handledFetchErrorRef.current = null;
    }
  }, [portfolioId]);

  useEffect(() => {
    if (!rawPortfolioId || portfolioId) return;
    if (handledInvalidPortfolioRef.current === rawPortfolioId) return;
    handledInvalidPortfolioRef.current = rawPortfolioId;
    toast.error(t("profileNotFound"));
  }, [portfolioId, rawPortfolioId, t]);

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

  const handleAddInstructors = async (userIds: string[]) => {
    setIsAdding(true);
    try {
      return await finalizeBulkUserPickerSubmit<InstructorRosterMember>({
        userIds,
        submit: (ids) => addInstructorRosterBulkService({ user_ids: ids }),
        mapSucceededIds: (added) => added.map((member) => member.id),
        afterSubmit: async () => {
          await mutate();
        },
        toasts: {
          onSuccess: () => toast.success(t("addSuccess")),
          onAllFailed: () => toast.error(t("addAllFailed")),
          onPartialSuccess: (succeeded, failed) =>
            toast.warning(
              t("addPartialSuccess", {
                succeeded: String(succeeded),
                failed: String(failed),
              }),
            ),
          onApiError: (fetchError) => toastApiError(tErrors, fetchError),
        },
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteInstructorRosterService(deleteTarget.id);
      toast.success(tc("deleteSuccess"));
      setDeleteOpen(false);
      if (portfolioId === deleteTarget.id) {
        setPortfolioId(null);
      }
      setDeleteTarget(null);
      await mutate();
    } catch (fetchError) {
      toastApiError(tErrors, fetchError);
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
          <InstructorRosterRowActions
            onViewProfile={() => setPortfolioId(row.id)}
            onDelete={() => {
              setDeleteTarget(row);
              setDeleteOpen(true);
            }}
          />
        )}
      />

      <InstructorPageFooter {...footerProps}>
        <InstructorProfileAndDeleteDialogs
          profileOpen={profileOpen}
          onProfileOpenChange={(open) => {
            if (!open) {
              setPortfolioId(null);
            }
          }}
          profile={resolveInstructorApplicationProfile(displayProfile)}
          application={displayProfile}
          fullName={applicantDisplayName}
          avatarUrl={displayProfile?.avatar ?? selectedMember?.avatar}
          profileTitle={t("profileTitle", {
            name: applicantDisplayName,
          })}
          profileLoading={detailLoading && !error}
          deleteOpen={deleteOpen}
          onDeleteOpenChange={setDeleteOpen}
          onDeleteConfirm={handleDelete}
          isDeleting={isDeleting}
          deleteTitle={t("deleteTitle")}
          deleteDescription={t("deleteDescription", {
            name: deleteTarget?.full_name ?? "",
          })}
        />
        <InstructorRosterPickerDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onConfirm={handleAddInstructors}
          isSubmitting={isAdding}
        />
      </InstructorPageFooter>
    </div>
  );
}
