import { useTranslations } from "next-intl";
import { SUB_LESSON_KIND_ICONS } from "@/constants/course/sub-lesson-kind-icons";
import { cn } from "@/lib/utils";
import type { CourseSubLessonKind } from "@/types/course";

type SubLessonKindLabelProps = {
  kind: CourseSubLessonKind;
  showPreview?: boolean;
  className?: string;
};

/** Type label with matching icon for outline sub-lesson rows. */
export function SubLessonKindLabel({
  kind,
  showPreview = false,
  className,
}: SubLessonKindLabelProps) {
  const tCommon = useTranslations("course.common");
  const Icon = SUB_LESSON_KIND_ICONS[kind];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>
        {tCommon(`subLessonKind.${kind}`)}
        {showPreview && kind !== "QUIZ" ? ` · ${tCommon("preview")}` : ""}
      </span>
    </div>
  );
}
