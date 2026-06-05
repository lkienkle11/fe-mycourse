"use client";

import type { ReactNode } from "react";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type {
  DataTableProps,
  DataTableRow,
} from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import type { InstructorProfilePayload } from "@/types/instructor";
import type { PermissionName } from "@/types/permissions";
import { InstructorListPagination } from "./instructor-list-pagination";
import { InstructorProfileViewDialog } from "./instructor-profile-view-dialog";

type InstructorViewProfileActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function InstructorViewProfileActionButton({
  label,
  onClick,
  disabled = false,
}: InstructorViewProfileActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

type InstructorDeleteActionButtonProps = {
  permission: PermissionName;
  label: string;
  onClick: () => void;
};

export function InstructorDeleteActionButton({
  permission,
  label,
  onClick,
}: InstructorDeleteActionButtonProps) {
  return (
    <PermissionGate permissions={[permission]}>
      <Button type="button" variant="destructive" size="sm" onClick={onClick}>
        {label}
      </Button>
    </PermissionGate>
  );
}

type InstructorActionGroupProps = {
  direction?: "row" | "column";
  viewButton: ReactNode;
  deleteButton: ReactNode;
  children?: ReactNode;
};

export function InstructorActionGroup({
  direction = "row",
  viewButton,
  deleteButton,
  children,
}: InstructorActionGroupProps) {
  return (
    <div
      className={direction === "column" ? "flex flex-col gap-2" : "flex gap-2"}
    >
      {viewButton}
      {children}
      {deleteButton}
    </div>
  );
}

type InstructorProfileDeleteActionsProps = {
  direction?: "row" | "column";
  viewLabel: string;
  onView: () => void;
  deletePermission: PermissionName;
  deleteLabel: string;
  onDelete: () => void;
  viewDisabled?: boolean;
  children?: ReactNode;
};

export function InstructorProfileDeleteActions({
  direction = "row",
  viewLabel,
  onView,
  deletePermission,
  deleteLabel,
  onDelete,
  viewDisabled = false,
  children,
}: InstructorProfileDeleteActionsProps) {
  return (
    <InstructorActionGroup
      direction={direction}
      viewButton={
        <InstructorViewProfileActionButton
          label={viewLabel}
          disabled={viewDisabled}
          onClick={onView}
        />
      }
      deleteButton={
        <InstructorDeleteActionButton
          permission={deletePermission}
          label={deleteLabel}
          onClick={onDelete}
        />
      }
    >
      {children}
    </InstructorActionGroup>
  );
}

type InstructorProfileAndDeleteDialogsProps = {
  profileOpen: boolean;
  onProfileOpenChange: (open: boolean) => void;
  profile: InstructorProfilePayload | null;
  fullName?: string;
  avatarUrl?: string;
  profileTitle?: string;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  deleteTitle: string;
  deleteDescription: string;
};

export function InstructorProfileAndDeleteDialogs({
  profileOpen,
  onProfileOpenChange,
  profile,
  fullName,
  avatarUrl,
  profileTitle,
  deleteOpen,
  onDeleteOpenChange,
  onDeleteConfirm,
  isDeleting = false,
  deleteTitle,
  deleteDescription,
}: InstructorProfileAndDeleteDialogsProps) {
  return (
    <>
      <InstructorProfileViewDialog
        open={profileOpen}
        onOpenChange={onProfileOpenChange}
        profile={profile}
        fullName={fullName}
        avatarUrl={avatarUrl}
        title={profileTitle}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={onDeleteConfirm}
        isLoading={isDeleting}
        title={deleteTitle}
        description={deleteDescription}
      />
    </>
  );
}

type InstructorProfileDeleteFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
  profileOpen: boolean;
  onProfileOpenChange: (open: boolean) => void;
  profile: InstructorProfilePayload | null;
  fullName?: string;
  avatarUrl?: string;
  profileTitle?: string;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  deleteTitle: string;
  deleteDescription: string;
  children?: ReactNode;
};

export function InstructorProfileDeleteFooter({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageOfLabel,
  profileOpen,
  onProfileOpenChange,
  profile,
  fullName,
  avatarUrl,
  profileTitle,
  deleteOpen,
  onDeleteOpenChange,
  onDeleteConfirm,
  isDeleting = false,
  deleteTitle,
  deleteDescription,
  children,
}: InstructorProfileDeleteFooterProps) {
  return (
    <InstructorPageFooter
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      pageOfLabel={pageOfLabel}
    >
      {children}
      <InstructorProfileAndDeleteDialogs
        profileOpen={profileOpen}
        onProfileOpenChange={onProfileOpenChange}
        profile={profile}
        fullName={fullName}
        avatarUrl={avatarUrl}
        profileTitle={profileTitle}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={onDeleteOpenChange}
        onDeleteConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
        deleteTitle={deleteTitle}
        deleteDescription={deleteDescription}
      />
    </InstructorPageFooter>
  );
}

type InstructorPageFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
  children?: ReactNode;
};

type InstructorPageFooterConfig = Omit<InstructorPageFooterProps, "children">;
type InstructorPageInfo = {
  page?: number;
  total_pages?: number;
};
type InstructorPageFooterLabels = {
  previousLabel: string;
  nextLabel: string;
  buildPageOfLabel: (page: number, totalPages: number) => string;
};

export function InstructorPageFooter({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageOfLabel,
  children,
}: InstructorPageFooterProps) {
  return (
    <>
      <InstructorListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        pageOfLabel={pageOfLabel}
      />
      {children}
    </>
  );
}

export function buildInstructorPageFooterConfig(
  page: number,
  totalPages: number,
  onPageChange: (page: number) => void,
  previousLabel: string,
  nextLabel: string,
  pageOfLabel: string,
): InstructorPageFooterConfig {
  return {
    page,
    totalPages,
    onPageChange,
    previousLabel,
    nextLabel,
    pageOfLabel,
  };
}

export function buildInstructorPageFooterFromInfo(
  pageInfo: InstructorPageInfo | null | undefined,
  fallbackPage: number,
  onPageChange: (page: number) => void,
  labels: InstructorPageFooterLabels,
): InstructorPageFooterConfig {
  const page = pageInfo?.page ?? fallbackPage;
  const totalPages = pageInfo?.total_pages ?? 1;

  return buildInstructorPageFooterConfig(
    page,
    totalPages,
    onPageChange,
    labels.previousLabel,
    labels.nextLabel,
    labels.buildPageOfLabel(page, totalPages),
  );
}

type InstructorTableSectionProps<TRow extends DataTableRow> = {
  isLoading: boolean;
  loadingLabel: ReactNode;
} & DataTableProps<TRow>;

export function InstructorTableSection<TRow extends DataTableRow>({
  isLoading,
  loadingLabel,
  ...tableProps
}: InstructorTableSectionProps<TRow>) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{loadingLabel}</p>;
  }

  return <DataTable {...tableProps} />;
}
