"use client";

import { useTranslations } from "next-intl";
import { useContinueLearning } from "@/api/hooks/course";
import {
  HOME_CONTINUE_INITIAL_LIMIT,
  HOME_CONTINUE_MAX_LIMIT,
} from "@/constants/home";
import { PERMISSIONS } from "@/constants/permissions";
import { useGetMe, useHasPermission } from "@/hooks/auth";
import { useExpandMore } from "@/hooks/home";
import { ContinueLearningCard } from "./continue-learning-card";
import { ExpandMoreFooter } from "./expand-more-footer";
import { HomeSectionShell } from "./home-section-shell";

/** Complete your Course: only for a signed-in user who can read courses (the endpoint needs `course:read`). */
export function HomeContinueLearningSection() {
  const t = useTranslations("home.signedIn");
  const { me } = useGetMe();
  const canReadCourses = useHasPermission(PERMISSIONS.CourseRead);
  const userId = me && canReadCourses ? me.user_id : null;
  const { limit, isExpanded, expand } = useExpandMore({
    initialLimit: HOME_CONTINUE_INITIAL_LIMIT,
    maxLimit: HOME_CONTINUE_MAX_LIMIT,
  });
  const { rows, isLoading, error, mutate } = useContinueLearning(limit, userId);

  if (!userId) return null;

  const hasError = Boolean(error) && rows.length === 0;
  const canExpand = !isExpanded && rows.length >= HOME_CONTINUE_INITIAL_LIMIT;

  return (
    <HomeSectionShell
      title={t("continueLearning.title")}
      description={t("sectionDescription")}
      isLoading={isLoading}
      hasError={hasError}
      isEmpty={rows.length === 0}
      onRetry={() => void mutate()}
      skeletonCount={HOME_CONTINUE_INITIAL_LIMIT}
      gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-[895px] lg:grid-cols-3"
      skeletonItemClassName="h-[230px] w-full rounded-[23px]"
      emptyMessage={t("continueLearning.empty")}
      errorMessage={t("continueLearning.error")}
      retryLabel={t("retry")}
      footer={
        canExpand ? (
          <ExpandMoreFooter label={t("expandMore")} onExpand={expand} />
        ) : null
      }
    >
      {rows.map((item) => (
        <ContinueLearningCard key={item.course_id} item={item} />
      ))}
    </HomeSectionShell>
  );
}
