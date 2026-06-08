"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CourseVersionStatus } from "@/types/course";

const STATUS_VARIANTS: Record<
  CourseVersionStatus,
  "secondary" | "outline" | "default" | "destructive"
> = {
  DRAFT: "secondary",
  IN_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export type CourseStatusBadgeProps = {
  status: CourseVersionStatus | "";
};

export function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  const t = useTranslations("course.common");

  if (!status) {
    return <Badge variant="outline">{t("noVersionYet")}</Badge>;
  }

  return (
    <Badge variant={STATUS_VARIANTS[status]}>{t(`status.${status}`)}</Badge>
  );
}
