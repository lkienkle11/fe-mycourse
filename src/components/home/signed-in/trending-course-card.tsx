"use client";

import { useTranslations } from "next-intl";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import type { TrendingCourseItem } from "@/types/course";
import { CourseCardFrame, CourseOwnerLine } from "./course-card-parts";

/** Trending card: thumbnail, title, owner and short description only (the API returns no price, rating or badge). */
export function TrendingCourseCard({ item }: { item: TrendingCourseItem }) {
  const t = useTranslations("home.signedIn");

  return (
    <CourseCardFrame slug={item.slug}>
      <CourseThumbnail
        src={item.thumbnail_url}
        alt={t("courseCard.imageAlt", { title: item.title })}
      />
      <p className="mt-1 line-clamp-1 text-base font-bold leading-[21px] text-black">
        {item.title}
      </p>
      <CourseOwnerLine name={item.owner_display_name} />
      <p className="line-clamp-3 text-sm leading-[18px] text-object-black/90">
        {item.short_description}
      </p>
    </CourseCardFrame>
  );
}
