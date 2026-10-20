"use client";

import { useTranslations } from "next-intl";
import { usePopularInstructors } from "@/api/hooks/instructor";
import { HOME_POPULAR_INSTRUCTORS_LIMIT } from "@/constants/home";
import { HomeSectionShell } from "./home-section-shell";
import { PopularInstructorCard } from "./popular-instructor-card";

export function HomePopularInstructorsSection() {
  const t = useTranslations("home.signedIn");
  const { rows, isLoading, error, mutate } = usePopularInstructors(
    HOME_POPULAR_INSTRUCTORS_LIMIT,
  );

  return (
    <HomeSectionShell
      title={t("popularInstructors.title")}
      description={t("sectionDescription")}
      isLoading={isLoading}
      hasError={Boolean(error) && rows.length === 0}
      isEmpty={rows.length === 0}
      onRetry={() => void mutate()}
      skeletonCount={HOME_POPULAR_INSTRUCTORS_LIMIT}
      gridClassName="sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
      skeletonItemClassName="aspect-[285/400] w-full rounded-[30px]"
      emptyMessage={t("popularInstructors.empty")}
      errorMessage={t("popularInstructors.error")}
      retryLabel={t("retry")}
    >
      {rows.map((item) => (
        <PopularInstructorCard key={item.user_id} item={item} />
      ))}
    </HomeSectionShell>
  );
}
