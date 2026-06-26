"use client";

import { useTranslations } from "next-intl";
import {
  type ComponentProps,
  type ComponentType,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  deleteCourseLessonService,
  deleteCourseSectionService,
  deleteCourseSubLessonService,
} from "@/api/callers/course";
import { useCourseDetail } from "@/api/hooks/course";
import { useTaxonomyList } from "@/api/hooks/taxonomy/useTaxonomy";
import { CourseBasicInfoTab } from "@/components/features/course/course-editor-basic-tab";
import { CourseCollaboratorsTab } from "@/components/features/course/course-editor-collaborators-tab";
import {
  CourseLessonDialog,
  CourseMediaDialogs,
  CourseSectionDialog,
  CourseSubLessonDialog,
} from "@/components/features/course/course-editor-dialogs";
import { CourseOutlineTab } from "@/components/features/course/course-editor-outline-tab";
import { CourseEditorReviewHistoryTab } from "@/components/features/course/course-editor-review-history-tab";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourseEditorState } from "@/hooks/course";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { Link } from "@/i18n/navigation";
import {
  instructorCourseEditorTabHref,
  instructorCoursesHref,
  instructorRootHref,
} from "@/lib/navigation/routes";
import { courseEditorTabs } from "@/lib/utils/course";
import type { CourseEditorTab } from "@/types/course";

type CourseEditorTabPropsMap = {
  info: ComponentProps<typeof CourseBasicInfoTab>;
  outline: ComponentProps<typeof CourseOutlineTab>;
  collaborators: ComponentProps<typeof CourseCollaboratorsTab>;
  pricing: ComponentProps<typeof CourseEditorComingSoonTab>;
  certificate: ComponentProps<typeof CourseEditorComingSoonTab>;
  "review-history": ComponentProps<typeof CourseEditorReviewHistoryTab>;
};

type CourseEditorTabPanelDefinition<
  TTab extends CourseEditorTab = CourseEditorTab,
> = {
  Component: ComponentType<CourseEditorTabPropsMap[TTab]>;
  props: CourseEditorTabPropsMap[TTab];
};

type AnyCourseEditorTabPanelDefinition = {
  Component: ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
};

function renderCourseEditorTabPanel(panel: AnyCourseEditorTabPanelDefinition) {
  const PanelComponent = panel.Component;
  return <PanelComponent {...panel.props} />;
}

export function InstructorCourseEditorPage({
  courseId,
  tab,
}: {
  courseId: string;
  tab: CourseEditorTab;
}) {
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("course.common");
  const tEditor = useTranslations("course.editor");
  const tToast = useTranslations("course.editor.toast");
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { data, isLoading, mutate } = useCourseDetail(courseId);
  const editableVersion = data?.draft_version;
  const liveVersion = data?.live_version;
  const activeVersion = editableVersion ?? liveVersion;
  const editable = editableVersion?.status === "DRAFT";
  const rejectionReason =
    data?.last_rejection_reason ??
    (editableVersion?.status === "REJECTED"
      ? editableVersion.rejection_reason
      : "");
  const canManageCollaborators = data?.collaborator_role === "OWNER";
  const canManageReviewWorkflow = data?.collaborator_role === "OWNER";
  const outline = data?.outline ?? [];

  const {
    isPreparingDraft,
    isSavingBasicInfo,
    thumbnailDialogOpen,
    setThumbnailDialogOpen,
    previewDialogOpen,
    setPreviewDialogOpen,
    sectionDialog,
    sectionForm,
    setSectionForm,
    lessonDialog,
    lessonForm,
    setLessonForm,
    subLessonDialog,
    subLessonForm,
    setSubLessonForm,
    isSubmittingCollaborator,
    videoDialogOpen,
    setVideoDialogOpen,
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeId,
    setOutcomeId,
    withEphemeralLease,
    handlePrepareDraft,
    handleSaveBasicInfo,
    openSectionDialog,
    closeSectionDialog,
    saveSection,
    openLessonDialog,
    closeLessonDialog,
    saveLesson,
    openSubLessonDialog,
    closeSubLessonDialog,
    saveSubLesson,
    toggleSelection,
    handleAddCollaborators,
    handleRemoveCollaborator,
    handleSubmitReview,
    handleReopenDraft,
    refreshDetail,
    handleReorderSections,
    handleReverseSections,
    handleReorderLessons,
    handleReorderSubLessons,
  } = useCourseEditorState({
    courseId,
    courseDetail: data,
    activeVersion,
    editableVersion,
    mutateDetail: mutate,
  });
  const basicInfoFilters =
    tab === "info" ? { page: 1, per_page: 100, include_images: false } : null;
  const { rows: levelRows } = useTaxonomyList("levels", basicInfoFilters);
  const { rows: topicRows } = useTaxonomyList("topics", basicInfoFilters);
  const { rows: tagRows } = useTaxonomyList("tags", basicInfoFilters);
  const { rows: skillRows } = useTaxonomyList("skills", basicInfoFilters);
  const { rows: outcomeRows } = useTaxonomyList("outcomes", basicInfoFilters);
  const handleConfirmSubmitReview = async () => {
    setIsSubmittingReview(true);
    try {
      const submitted = await handleSubmitReview();
      if (submitted) {
        setSubmitConfirmOpen(false);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const courseTitleLabel = isLoading
    ? tCommon("loadingCourse")
    : (activeVersion?.title ?? tCommon("notLoaded"));
  const headerActions = useMemo(() => {
    if (!canManageReviewWorkflow) {
      return null;
    }

    if (!editableVersion && liveVersion) {
      return (
        <Button
          type="button"
          disabled={isPreparingDraft}
          onClick={() => void handlePrepareDraft()}
        >
          {isPreparingDraft
            ? tEditor("actions.preparingDraft")
            : tEditor("actions.prepareDraft")}
        </Button>
      );
    }

    if (editableVersion?.status === "DRAFT") {
      return (
        <Button type="button" onClick={() => setSubmitConfirmOpen(true)}>
          {tEditor("actions.submitForReview")}
        </Button>
      );
    }

    if (editableVersion?.status === "REJECTED") {
      return (
        <Button type="button" onClick={() => void handleReopenDraft()}>
          {tEditor("actions.reopenDraft")}
        </Button>
      );
    }

    return null;
  }, [
    canManageReviewWorkflow,
    editableVersion,
    handlePrepareDraft,
    handleReopenDraft,
    isPreparingDraft,
    liveVersion,
    tEditor,
  ]);
  const headerOverride = useMemo(
    () => ({
      breadcrumbs: [
        {
          key: "instructor-root",
          label: tDashboard("instructor.title"),
          href: instructorRootHref,
        },
        {
          key: "instructor-courses",
          label: tDashboard("instructor.menu.courses"),
          href: instructorCoursesHref,
        },
        {
          key: "course-title",
          label: courseTitleLabel,
          href: instructorCourseEditorTabHref(courseId, "info"),
        },
        {
          key: `course-tab-${tab}`,
          label: tEditor(`tabs.${tab}`),
        },
      ],
      title: courseTitleLabel,
      description:
        !isLoading && activeVersion ? tEditor("learnerNotice") : undefined,
      actions: headerActions,
    }),
    [
      activeVersion,
      courseTitleLabel,
      courseId,
      headerActions,
      isLoading,
      tab,
      tDashboard,
      tEditor,
    ],
  );

  useRegisterDashboardPageHeader(headerOverride);

  if (!data && isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!data || !activeVersion) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{tCommon("notLoaded")}</p>
        <Button asChild variant="outline">
          <Link href={instructorCoursesHref}>{tCommon("backToCourses")}</Link>
        </Button>
      </div>
    );
  }

  const basicInfoTabProps = {
    editable,
    state: {
      basicInfo,
      setBasicInfo,
      tagSelection,
      skillSelection,
      outcomeId,
    },
    taxonomyRows: {
      levelRows,
      topicRows,
      tagRows,
      skillRows,
      outcomeRows,
    },
    actions: {
      isSavingBasicInfo,
      onToggleSelection: toggleSelection,
      setOutcomeId,
      onSave: () => void handleSaveBasicInfo(),
      onOpenThumbnailDialog: () => setThumbnailDialogOpen(true),
      onOpenPreviewDialog: () => setPreviewDialogOpen(true),
    },
  } satisfies ComponentProps<typeof CourseBasicInfoTab>;

  const outlineTabProps = {
    editable,
    outline,
    actions: {
      onAddSection: () => void openSectionDialog(),
      onReverseSections: () => handleReverseSections(outline),
      onReorderSections: handleReorderSections,
      onEditSection: (section) => void openSectionDialog(section),
      onDeleteSection: (section) =>
        void withEphemeralLease("SECTION", section.stable_id, async () => {
          await deleteCourseSectionService(courseId, section.id);
          toast.success(tToast("sectionDeleted"));
          await refreshDetail();
        }),
      onAddLesson: (section) => void openLessonDialog(section),
      onEditLesson: (section, lesson) => void openLessonDialog(section, lesson),
      onDeleteLesson: (lesson) =>
        void withEphemeralLease("LESSON", lesson.stable_id, async () => {
          await deleteCourseLessonService(courseId, lesson.id);
          toast.success(tToast("lessonDeleted"));
          await refreshDetail();
        }),
      onReorderLessons: handleReorderLessons,
      onAddSubLesson: (lesson) => void openSubLessonDialog(lesson),
      onEditSubLesson: (lesson, subLesson) =>
        void openSubLessonDialog(lesson, subLesson),
      onDeleteSubLesson: (subLesson) =>
        void withEphemeralLease("SUB_LESSON", subLesson.stable_id, async () => {
          await deleteCourseSubLessonService(courseId, subLesson.id);
          toast.success(tToast("itemDeleted"));
          await refreshDetail();
        }),
      onReorderSubLessons: handleReorderSubLessons,
    },
  } satisfies ComponentProps<typeof CourseOutlineTab>;

  const collaboratorsTabProps = {
    courseId,
    canManageCollaborators,
    isSubmittingCollaborator,
    onAddCollaborators: handleAddCollaborators,
    onRemoveCollaborator: handleRemoveCollaborator,
  } satisfies ComponentProps<typeof CourseCollaboratorsTab>;

  const courseEditorTabPanels = {
    info: {
      Component: CourseBasicInfoTab,
      props: basicInfoTabProps,
    },
    outline: {
      Component: CourseOutlineTab,
      props: outlineTabProps,
    },
    collaborators: {
      Component: CourseCollaboratorsTab,
      props: collaboratorsTabProps,
    },
    pricing: {
      Component: CourseEditorComingSoonTab,
      props: {
        value: "pricing",
        title: tEditor("pricing.title"),
        description: tEditor("pricing.description"),
        comingSoonLabel: tEditor("pricing.comingSoon"),
      },
    },
    certificate: {
      Component: CourseEditorComingSoonTab,
      props: {
        value: "certificate",
        title: tEditor("certificate.title"),
        description: tEditor("certificate.description"),
        comingSoonLabel: tEditor("certificate.comingSoon"),
      },
    },
    "review-history": {
      Component: CourseEditorReviewHistoryTab,
      props: {
        courseId,
      },
    },
  } satisfies {
    [TTab in CourseEditorTab]: CourseEditorTabPanelDefinition<TTab>;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CourseStatusBadge status={activeVersion.status} />
          <Badge variant="outline">
            {tCommon("versionBadge", {
              version: String(
                editableVersion?.version_no ?? liveVersion?.version_no ?? 0,
              ),
            })}
          </Badge>
          {liveVersion && editableVersion ? (
            <Badge variant="secondary">
              {tCommon("publishedVersionBadge", {
                version: String(liveVersion.version_no),
              })}
            </Badge>
          ) : null}
          <Badge variant="outline">
            {tCommon(`collaboratorRole.${data.collaborator_role}`)}
          </Badge>
        </div>
        {rejectionReason ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {tEditor("rejectionReason", {
              reason: rejectionReason,
            })}
          </p>
        ) : null}
      </div>

      <Tabs value={tab}>
        <div className="overflow-x-auto pb-1">
          <TabsList
            variant="line"
            className="min-w-full justify-start gap-1 border-b pb-1"
          >
            {courseEditorTabs.map((tabKey) => (
              <TabsTrigger
                key={tabKey}
                value={tabKey}
                className="flex-none"
                asChild
              >
                <Link href={instructorCourseEditorTabHref(courseId, tabKey)}>
                  {tEditor(`tabs.${tabKey}`)}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {renderCourseEditorTabPanel(
          courseEditorTabPanels[
            tab
          ] as unknown as AnyCourseEditorTabPanelDefinition,
        )}
      </Tabs>

      <CourseSectionDialog
        sectionDialog={sectionDialog}
        sectionForm={sectionForm}
        setSectionForm={setSectionForm}
        onClose={() => void closeSectionDialog()}
        onSave={() => void saveSection()}
      />

      <CourseLessonDialog
        lessonDialog={lessonDialog}
        lessonForm={lessonForm}
        setLessonForm={setLessonForm}
        onClose={() => void closeLessonDialog()}
        onSave={() => void saveLesson()}
      />

      <CourseSubLessonDialog
        subLessonDialog={subLessonDialog}
        subLessonForm={subLessonForm}
        setSubLessonForm={setSubLessonForm}
        onClose={() => void closeSubLessonDialog()}
        onSave={() => void saveSubLesson()}
        onOpenVideoDialog={() => setVideoDialogOpen(true)}
      />

      <CourseMediaDialogs
        thumbnailDialogOpen={thumbnailDialogOpen}
        setThumbnailDialogOpen={setThumbnailDialogOpen}
        previewDialogOpen={previewDialogOpen}
        setPreviewDialogOpen={setPreviewDialogOpen}
        basicInfo={basicInfo}
        setBasicInfo={setBasicInfo}
        videoDialogOpen={videoDialogOpen}
        setVideoDialogOpen={setVideoDialogOpen}
        subLessonForm={subLessonForm}
        setSubLessonForm={setSubLessonForm}
      />

      <ConfirmActionDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        onConfirm={handleConfirmSubmitReview}
        isLoading={isSubmittingReview}
        title={tEditor("submitConfirm.title")}
        description={tEditor("submitConfirm.description")}
        cancelLabel={tCommon("cancel")}
        confirmLabel={tEditor("submitConfirm.confirm")}
        loadingLabel={tEditor("submitConfirm.submitting")}
      />
    </div>
  );
}

function CourseEditorComingSoonTab({
  value,
  title,
  description,
  comingSoonLabel,
}: {
  value: "pricing" | "certificate";
  title: string;
  description: string;
  comingSoonLabel: string;
}) {
  return (
    <TabsContent value={value}>
      <ComingSoonCard
        title={title}
        description={description}
        comingSoonLabel={comingSoonLabel}
      />
    </TabsContent>
  );
}

function ComingSoonCard({
  title,
  description,
  comingSoonLabel,
}: {
  title: string;
  description: string;
  comingSoonLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{comingSoonLabel}</p>
      </CardContent>
    </Card>
  );
}
