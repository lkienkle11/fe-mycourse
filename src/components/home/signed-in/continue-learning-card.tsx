"use client";

import { useTranslations } from "next-intl";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import type { ContinueLearningItem } from "@/types/course";
import { CourseCardFrame, CourseOwnerLine } from "./course-card-parts";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function ContinueLearningCard({ item }: { item: ContinueLearningItem }) {
  const t = useTranslations("home.signedIn");
  const percent = clampPercent(item.progress_percent);

  return (
    <CourseCardFrame slug={item.slug}>
      <CourseThumbnail
        src={item.thumbnail_url}
        alt={t("courseCard.imageAlt", { title: item.title })}
      >
        <div
          role="progressbar"
          aria-label={t("continueLearning.progressLabel", {
            title: item.title,
          })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          className="absolute inset-x-0 bottom-0 h-1 bg-[rgba(249,249,249,0.9)]"
        >
          <div
            className="h-full rounded-full bg-base-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CourseThumbnail>
      <p className="mt-1 line-clamp-1 text-base font-bold leading-[21px] text-black">
        {item.title}
      </p>
      <CourseOwnerLine name={item.owner_display_name} />
      <p className="text-sm leading-[18px] text-object-black/90">
        {t("continueLearning.progress", {
          completed: String(item.completed_sub_lessons),
          total: String(item.total_sub_lessons),
        })}
      </p>
    </CourseCardFrame>
  );
}
