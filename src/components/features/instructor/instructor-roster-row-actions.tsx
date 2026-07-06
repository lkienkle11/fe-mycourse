"use client";

import { useTranslations } from "next-intl";
import { CourseAdminTableActionsMenu } from "@/components/features/course/course-admin-table-actions-menu";
import { DeferredDropdownMenuItem } from "@/components/shared/deferred-dropdown-menu-item";
import { PermissionGate } from "@/components/shared/permission-gate";
import { PERMISSIONS } from "@/constants/permissions";

export type InstructorRosterRowActionsProps = {
  onViewProfile: () => void;
  onDelete: () => void;
};

export function InstructorRosterRowActions({
  onViewProfile,
  onDelete,
}: InstructorRosterRowActionsProps) {
  const t = useTranslations("instructor.roster");
  const tc = useTranslations("instructor.common");

  return (
    <CourseAdminTableActionsMenu menuLabel={tc("actionsMenu")}>
      <DeferredDropdownMenuItem onAction={onViewProfile}>
        {t("viewProfile")}
      </DeferredDropdownMenuItem>
      <PermissionGate permissions={[PERMISSIONS.InstructorRosterDelete]}>
        <DeferredDropdownMenuItem variant="destructive" onAction={onDelete}>
          {tc("delete")}
        </DeferredDropdownMenuItem>
      </PermissionGate>
    </CourseAdminTableActionsMenu>
  );
}
