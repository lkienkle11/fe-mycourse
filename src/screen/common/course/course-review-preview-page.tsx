"use client";

import { useTranslations } from "next-intl";

export function CourseReviewPreviewPage() {
  const t = useTranslations("course.review.preview");

  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      {t("placeholder")}
    </div>
  );
}
