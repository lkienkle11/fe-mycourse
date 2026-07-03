"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteInstructorProfileService } from "@/api/callers/instructor";
import {
  useInstructorProfileDetail,
  useInstructorProfilesList,
} from "@/api/hooks/instructor";
import {
  buildInstructorPageFooterFromInfo,
  InstructorProfileDeleteActions,
  InstructorProfileDeleteFooter,
  InstructorTableSection,
} from "@/components/features/instructor/instructor-action-controls";
import { InstructorUserCell } from "@/components/features/instructor/instructor-user-cell";
import type { DataTableColumn } from "@/components/shared/data-table";
import { PERMISSIONS } from "@/constants/permissions";
import {
  resolveInstructorApplicationProfile,
  resolveInstructorDisplayName,
} from "@/lib/instructor-application/helpers";
import { toastApiError } from "@/lib/utils/api-error";
import type {
  InstructorListFilters,
  InstructorProfile,
} from "@/types/instructor";

export function InstructorProfilesPage() {
  const t = useTranslations("instructor.profiles");
  const tc = useTranslations("instructor.common");
  const tErrors = useTranslations("errors.codes");
  const [filters, setFilters] = useState<InstructorListFilters>({
    page: 1,
    per_page: 20,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<InstructorProfile | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstructorProfile | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { rows, pageInfo, isLoading, mutate } =
    useInstructorProfilesList(filters);
  const { data: detailProfile, isLoading: detailLoading } =
    useInstructorProfileDetail(profileOpen ? viewUserId : null);
  const displayProfile = detailProfile ?? selected;
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

  const columns = useMemo<DataTableColumn<InstructorProfile>[]>(
    () => [
      {
        id: "user",
        header: t("columns.user"),
        cell: (row) => <InstructorUserCell user={row} />,
      },
      {
        id: "headline",
        header: t("columns.headline"),
        cell: (row) =>
          resolveInstructorApplicationProfile(row)?.headline || "—",
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
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <InstructorTableSection
        isLoading={isLoading}
        loadingLabel={tc("loading")}
        columns={columns}
        rows={rows}
        actionsHeader={tc("actions")}
        emptyMessage={tc("empty")}
        renderActions={(row) => (
          <InstructorProfileDeleteActions
            viewLabel={t("view")}
            onView={() => {
              setSelected(row);
              setViewUserId(row.user_id);
              setProfileOpen(true);
            }}
            deletePermission={PERMISSIONS.InstructorProfileDelete}
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
        onProfileOpenChange={(open) => {
          setProfileOpen(open);
          if (!open) {
            setViewUserId(null);
          }
        }}
        profile={resolveInstructorApplicationProfile(displayProfile)}
        application={displayProfile}
        fullName={resolveInstructorDisplayName(displayProfile)}
        avatarUrl={displayProfile?.avatar}
        profileTitle={t("profileTitle", {
          name: displayProfile
            ? resolveInstructorDisplayName(displayProfile)
            : "",
        })}
        profileLoading={detailLoading}
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
