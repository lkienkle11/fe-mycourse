"use client";

import { useTranslations } from "next-intl";
import { useTrendingCourses } from "@/api/hooks/course";
import {
  HOME_TRENDING_INITIAL_LIMIT,
  HOME_TRENDING_MAX_LIMIT,
} from "@/constants/home";
import { useExpandMore } from "@/hooks/home";
import { ExpandMoreFooter } from "./expand-more-footer";
import { HomeSectionShell } from "./home-section-shell";
import { TrendingCourseCard } from "./trending-course-card";

export function HomeTrendingSection() {
  const t = useTranslations("home.signedIn");
  const { limit, isExpanded, expand } = useExpandMore({
    initialLimit: HOME_TRENDING_INITIAL_LIMIT,
    maxLimit: HOME_TRENDING_MAX_LIMIT,
  });
  const { rows, isLoading, error, mutate } = useTrendingCourses(limit);

  const hasError = Boolean(error) && rows.length === 0;
  const canExpand = !isExpanded && rows.length >= HOME_TRENDING_INITIAL_LIMIT;

  return (
    <HomeSectionShell
      title={t("trending.title")}
      description={t("sectionDescription")}
      isLoading={isLoading}
      hasError={hasError}
      isEmpty={rows.length === 0}
      onRetry={() => void mutate()}
      skeletonCount={HOME_TRENDING_INITIAL_LIMIT}
      gridClassName="sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-4"
      skeletonItemClassName="h-[318px] w-full rounded-[23px]"
      emptyMessage={t("trending.empty")}
      errorMessage={t("trending.error")}
      retryLabel={t("retry")}
      footer={
        canExpand ? (
          <ExpandMoreFooter label={t("expandMore")} onExpand={expand} />
        ) : null
      }
    >
      {rows.map((item) => (
        <TrendingCourseCard key={item.id} item={item} />
      ))}
    </HomeSectionShell>
  );
}
