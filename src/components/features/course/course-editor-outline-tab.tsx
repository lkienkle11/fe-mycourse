import { useTranslations } from "next-intl";
import { SortableList } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { extractDeltaPreviewText } from "@/lib/utils/course-delta";
import type {
  CourseLesson,
  CourseSection,
  CourseSubLesson,
} from "@/types/course";

type CourseOutlineTabProps = {
  editable: boolean;
  outline: CourseSection[];
  actions: {
    onAddSection: () => void;
    onReverseSections: () => void;
    onReorderSections: (sections: CourseSection[]) => void;
    onEditSection: (section: CourseSection) => void;
    onDeleteSection: (section: CourseSection) => void;
    onAddLesson: (section: CourseSection) => void;
    onEditLesson: (section: CourseSection, lesson: CourseLesson) => void;
    onDeleteLesson: (lesson: CourseLesson) => void;
    onReorderLessons: (section: CourseSection, lessons: CourseLesson[]) => void;
    onAddSubLesson: (lesson: CourseLesson) => void;
    onEditSubLesson: (lesson: CourseLesson, subLesson: CourseSubLesson) => void;
    onDeleteSubLesson: (subLesson: CourseSubLesson) => void;
    onReorderSubLessons: (
      lesson: CourseLesson,
      subLessons: CourseSubLesson[],
    ) => void;
  };
};

export function CourseOutlineTab({
  editable,
  outline,
  actions: {
    onAddSection,
    onReverseSections,
    onReorderSections,
    onEditSection,
    onDeleteSection,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onReorderLessons,
    onAddSubLesson,
    onEditSubLesson,
    onDeleteSubLesson,
    onReorderSubLessons,
  },
}: CourseOutlineTabProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.outline");
  return (
    <TabsContent value="outline" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editable ? (
            <p className="text-sm text-muted-foreground">{t("emptyDraft")}</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button type="button" variant="secondary" onClick={onAddSection}>
                {t("addSection")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReverseSections}
              >
                {t("reverseSections")}
              </Button>
            </div>
          )}

          {editable && outline.length > 0 ? (
            <SortableList
              items={outline.map((section) => ({
                id: section.stable_id,
                section,
              }))}
              dragLabel={t("reorderSection")}
              onReorder={(items) =>
                onReorderSections(items.map((item) => item.section))
              }
              renderItem={(item) => (
                <SectionOutlineCard
                  tCommon={tCommon}
                  t={t}
                  section={item.section}
                  onEdit={() => onEditSection(item.section)}
                  onDelete={() => onDeleteSection(item.section)}
                  onAddLesson={() => onAddLesson(item.section)}
                  onEditLesson={(lesson) => onEditLesson(item.section, lesson)}
                  onDeleteLesson={onDeleteLesson}
                  onReorderLessons={(lessons) =>
                    onReorderLessons(item.section, lessons)
                  }
                  onAddSubLesson={onAddSubLesson}
                  onEditSubLesson={onEditSubLesson}
                  onDeleteSubLesson={onDeleteSubLesson}
                  onReorderSubLessons={onReorderSubLessons}
                />
              )}
            />
          ) : null}

          {outline.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : null}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function SectionOutlineCard({
  tCommon,
  t,
  section,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onAddSubLesson,
  onEditSubLesson,
  onDeleteSubLesson,
  onReorderSubLessons,
}: {
  tCommon: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
  section: CourseSection;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteLesson: (lesson: CourseLesson) => void;
  onReorderLessons: (lessons: CourseLesson[]) => void;
  onAddSubLesson: (lesson: CourseLesson) => void;
  onEditSubLesson: (lesson: CourseLesson, subLesson: CourseSubLesson) => void;
  onDeleteSubLesson: (subLesson: CourseSubLesson) => void;
  onReorderSubLessons: (
    lesson: CourseLesson,
    subLessons: CourseSubLesson[],
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{section.title}</div>
            <div className="text-sm text-muted-foreground">
              {extractDeltaPreviewText(section.description) ||
                tCommon("noSectionDescription")}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddLesson}
            >
              {t("addLesson")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              {t("editSection")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              {t("deleteSection")}
            </Button>
          </div>
        </div>

        {section.lessons.length > 0 ? (
          <SortableList
            items={section.lessons.map((lesson) => ({
              id: lesson.stable_id,
              lesson,
            }))}
            dragLabel={t("reorderLesson")}
            onReorder={(items) =>
              onReorderLessons(items.map((item) => item.lesson))
            }
            renderItem={(item) => (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="font-medium">{item.lesson.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {extractDeltaPreviewText(item.lesson.summary) ||
                        tCommon("noLessonSummary")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onAddSubLesson(item.lesson)}
                    >
                      {t("addItem")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditLesson(item.lesson)}
                    >
                      {t("editLesson")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteLesson(item.lesson)}
                    >
                      {t("deleteLesson")}
                    </Button>
                  </div>
                </div>

                {item.lesson.sub_lessons.length > 0 ? (
                  <SortableList
                    items={item.lesson.sub_lessons.map((subLesson) => ({
                      id: subLesson.stable_id,
                      subLesson,
                    }))}
                    dragLabel={t("reorderLessonItem")}
                    onReorder={(items) =>
                      onReorderSubLessons(
                        item.lesson,
                        items.map((entry) => entry.subLesson),
                      )
                    }
                    renderItem={(entry) => (
                      <div className="rounded-md border p-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="font-medium">
                              {entry.subLesson.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tCommon(`subLessonKind.${entry.subLesson.kind}`)}
                              {entry.subLesson.is_preview &&
                              entry.subLesson.kind !== "QUIZ"
                                ? ` · ${tCommon("preview")}`
                                : ""}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onEditSubLesson(item.lesson, entry.subLesson)
                              }
                            >
                              {t("editItem")}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteSubLesson(entry.subLesson)}
                            >
                              {t("deleteItem")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {tCommon("noLessonItems")}
                  </p>
                )}
              </div>
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {tCommon("noLessons")}
          </p>
        )}
      </div>
    </div>
  );
}
