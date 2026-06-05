"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  acquireCourseLeaseService,
  addCourseCollaboratorService,
  createCourseLessonService,
  createCourseSectionService,
  createCourseSubLessonService,
  heartbeatCourseLeaseService,
  prepareCourseDraftService,
  releaseCourseLeaseService,
  removeCourseCollaboratorService,
  reopenCourseDraftService,
  submitCourseReviewService,
  updateCourseBasicInfoService,
  updateCourseLessonService,
  updateCourseSectionService,
  updateCourseSubLessonService,
} from "@/api/callers/course";
import type {
  CourseBasicInfoForm,
  CourseCollaborator,
  CourseEditorTab,
  CourseLease,
  CourseLesson,
  CourseLessonDialogState,
  CourseLessonFormState,
  CourseResourceType,
  CourseSection,
  CourseSectionDialogState,
  CourseSectionFormState,
  CourseSelectionKey,
  CourseSubLesson,
  CourseSubLessonDialogState,
  CourseSubLessonFormState,
  CourseVersion,
} from "@/types/course";

type UseCourseEditorStateParams = {
  courseId: number;
  activeVersion?: CourseVersion;
  editableVersion?: CourseVersion;
  mutate: () => Promise<unknown>;
};

function emptyDelta(): string {
  return JSON.stringify({ ops: [{ insert: "" }] }, null, 2);
}

function selectedIdsToMap(ids: number[]) {
  return new Set(ids);
}

export function rootOutlineStableId(courseId: number): string {
  return `course-${courseId}-outline-root`;
}

export function useCourseEditorState({
  courseId,
  activeVersion,
  editableVersion,
  mutate,
}: UseCourseEditorStateParams) {
  const t = useTranslations("course.editor.toast");
  const [activeTab, setActiveTab] = useState<CourseEditorTab>("basic");
  const [isPreparingDraft, setIsPreparingDraft] = useState(false);
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeLease, setActiveLease] = useState<CourseLease | null>(null);
  const [sectionDialog, setSectionDialog] =
    useState<CourseSectionDialogState | null>(null);
  const [lessonDialog, setLessonDialog] =
    useState<CourseLessonDialogState | null>(null);
  const [subLessonDialog, setSubLessonDialog] =
    useState<CourseSubLessonDialogState | null>(null);
  const [collaboratorUserId, setCollaboratorUserId] = useState("");
  const [isSubmittingCollaborator, setIsSubmittingCollaborator] =
    useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const [basicInfo, setBasicInfo] = useState<CourseBasicInfoForm>({
    title: "",
    short_description: "",
    about_course: "",
    thumbnail_file_id: "",
    thumbnail_url: "",
    preview_video_file_id: "",
    preview_video_url: "",
    course_level_id: "",
    course_topic_id: "",
    tag_ids: [],
    skill_ids: [],
    outcome_ids: [],
    expected_row_version: 0,
  });
  const [sectionForm, setSectionForm] = useState<CourseSectionFormState>({
    title: "",
    description: "",
    expected_row_version: 0,
  });
  const [lessonForm, setLessonForm] = useState<CourseLessonFormState>({
    section_id: 0,
    title: "",
    summary: "",
    expected_row_version: 0,
  });
  const [subLessonForm, setSubLessonForm] = useState<CourseSubLessonFormState>({
    lesson_id: 0,
    title: "",
    kind: "VIDEO",
    is_preview: false,
    expected_row_version: 0,
    video_file_id: "",
    video_url: "",
    text_delta: emptyDelta(),
    quiz_prompt: "",
    allow_multiple: false,
    quiz_options: [
      {
        option_key: crypto.randomUUID(),
        body: "",
        is_correct: false,
      },
    ],
  });

  const leaseVersionId = editableVersion?.id ?? 0;

  useEffect(() => {
    if (!activeVersion) {
      return;
    }
    setBasicInfo({
      title: activeVersion.title,
      short_description: activeVersion.short_description,
      about_course: activeVersion.about_course,
      thumbnail_file_id: activeVersion.thumbnail_file_id ?? "",
      thumbnail_url: activeVersion.thumbnail_url ?? "",
      preview_video_file_id: activeVersion.preview_video_file_id ?? "",
      preview_video_url: activeVersion.preview_video_url ?? "",
      course_level_id: activeVersion.course_level_id
        ? String(activeVersion.course_level_id)
        : "",
      course_topic_id: activeVersion.course_topic_id
        ? String(activeVersion.course_topic_id)
        : "",
      tag_ids: activeVersion.tag_ids ?? [],
      skill_ids: activeVersion.skill_ids ?? [],
      outcome_ids: activeVersion.outcome_ids ?? [],
      expected_row_version: activeVersion.row_version,
    });
  }, [activeVersion]);

  useEffect(() => {
    if (!activeLease) {
      return;
    }
    const timer = window.setInterval(() => {
      void heartbeatCourseLeaseService(courseId, activeLease.lease_token).catch(
        () => {
          toast.error(t("lockExpired"));
          setActiveLease(null);
        },
      );
    }, 120000);
    return () => window.clearInterval(timer);
  }, [activeLease, courseId, t]);

  const tagSelection = useMemo(
    () => selectedIdsToMap(basicInfo.tag_ids),
    [basicInfo.tag_ids],
  );
  const skillSelection = useMemo(
    () => selectedIdsToMap(basicInfo.skill_ids),
    [basicInfo.skill_ids],
  );
  const outcomeSelection = useMemo(
    () => selectedIdsToMap(basicInfo.outcome_ids),
    [basicInfo.outcome_ids],
  );

  const releaseLease = async () => {
    if (!activeLease) {
      return;
    }
    const token = activeLease.lease_token;
    setActiveLease(null);
    try {
      await releaseCourseLeaseService(courseId, { lease_token: token });
    } catch {}
  };

  const acquireLease = async (
    resourceType: CourseResourceType,
    resourceStableId: string,
  ) => {
    if (!leaseVersionId) {
      toast.error(t("draftRequiredOutline"));
      return null;
    }
    try {
      const lease = await acquireCourseLeaseService(courseId, {
        course_version_id: leaseVersionId,
        resource_type: resourceType,
        resource_stable_id: resourceStableId,
      });
      setActiveLease(lease);
      return lease;
    } catch {
      toast.error(t("leaseHeld"));
      return null;
    }
  };

  const withEphemeralLease = async (
    resourceType: CourseResourceType,
    resourceStableId: string,
    run: () => Promise<void>,
  ) => {
    const lease = await acquireLease(resourceType, resourceStableId);
    if (!lease) {
      return;
    }
    try {
      await run();
    } finally {
      await releaseLease();
    }
  };

  const refreshDetail = async () => {
    await mutate();
  };

  const handlePrepareDraft = async () => {
    setIsPreparingDraft(true);
    try {
      await prepareCourseDraftService(courseId);
      toast.success(t("draftPrepared"));
      await refreshDetail();
    } catch {
      toast.error(t("draftPrepareError"));
    } finally {
      setIsPreparingDraft(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!editableVersion) {
      toast.error(t("draftRequiredInfo"));
      return;
    }
    setIsSavingBasicInfo(true);
    try {
      await updateCourseBasicInfoService(courseId, {
        expected_row_version: basicInfo.expected_row_version,
        title: basicInfo.title,
        short_description: basicInfo.short_description,
        about_course: basicInfo.about_course,
        thumbnail_file_id: basicInfo.thumbnail_file_id || undefined,
        preview_video_file_id: basicInfo.preview_video_file_id || undefined,
        course_level_id: basicInfo.course_level_id
          ? Number(basicInfo.course_level_id)
          : undefined,
        course_topic_id: basicInfo.course_topic_id
          ? Number(basicInfo.course_topic_id)
          : undefined,
        tag_ids: basicInfo.tag_ids,
        skill_ids: basicInfo.skill_ids,
        outcome_ids: basicInfo.outcome_ids,
      });
      toast.success(t("basicInfoSaved"));
      await refreshDetail();
    } catch {
      toast.error(t("basicInfoSaveError"));
    } finally {
      setIsSavingBasicInfo(false);
    }
  };

  const openSectionDialog = async (section?: CourseSection) => {
    const lease = await acquireLease(
      section ? "SECTION" : "OUTLINE_ROOT",
      section?.stable_id ?? rootOutlineStableId(courseId),
    );
    if (!lease) {
      return;
    }
    setSectionForm({
      title: section?.title ?? "",
      description: section?.description ?? "",
      expected_row_version: section?.row_version ?? 0,
    });
    setSectionDialog({ mode: section ? "edit" : "create", section });
  };

  const closeSectionDialog = async () => {
    setSectionDialog(null);
    await releaseLease();
  };

  const saveSection = async () => {
    if (!sectionDialog) {
      return;
    }
    try {
      if (sectionDialog.mode === "create") {
        await createCourseSectionService(courseId, {
          title: sectionForm.title,
          description: sectionForm.description,
        });
      } else if (sectionDialog.section) {
        await updateCourseSectionService(courseId, sectionDialog.section.id, {
          title: sectionForm.title,
          description: sectionForm.description,
          expected_row_version: sectionForm.expected_row_version,
        });
      }
      toast.success(t("sectionSaved"));
      await closeSectionDialog();
      await refreshDetail();
    } catch {
      toast.error(t("sectionSaveError"));
    }
  };

  const openLessonDialog = async (
    section: CourseSection,
    lesson?: CourseLesson,
  ) => {
    const lease = await acquireLease(
      lesson ? "LESSON" : "SECTION",
      lesson?.stable_id ?? section.stable_id,
    );
    if (!lease) {
      return;
    }
    setLessonForm({
      section_id: section.id,
      title: lesson?.title ?? "",
      summary: lesson?.summary ?? "",
      expected_row_version: lesson?.row_version ?? 0,
    });
    setLessonDialog({ mode: lesson ? "edit" : "create", section, lesson });
  };

  const closeLessonDialog = async () => {
    setLessonDialog(null);
    await releaseLease();
  };

  const saveLesson = async () => {
    if (!lessonDialog) {
      return;
    }
    try {
      if (lessonDialog.mode === "create") {
        await createCourseLessonService(courseId, lessonForm);
      } else if (lessonDialog.lesson) {
        await updateCourseLessonService(
          courseId,
          lessonDialog.lesson.id,
          lessonForm,
        );
      }
      toast.success(t("lessonSaved"));
      await closeLessonDialog();
      await refreshDetail();
    } catch {
      toast.error(t("lessonSaveError"));
    }
  };

  const openSubLessonDialog = async (
    lesson: CourseLesson,
    subLesson?: CourseSubLesson,
  ) => {
    const lease = await acquireLease(
      subLesson ? "SUB_LESSON" : "LESSON",
      subLesson?.stable_id ?? lesson.stable_id,
    );
    if (!lease) {
      return;
    }
    setSubLessonForm({
      lesson_id: lesson.id,
      title: subLesson?.title ?? "",
      kind: subLesson?.kind ?? "VIDEO",
      is_preview: subLesson?.is_preview ?? false,
      expected_row_version: subLesson?.row_version ?? 0,
      video_file_id: subLesson?.video?.media_file_id ?? "",
      video_url: subLesson?.video?.media_url ?? "",
      text_delta: subLesson?.text?.content_delta ?? emptyDelta(),
      quiz_prompt: subLesson?.quiz?.prompt ?? "",
      allow_multiple: subLesson?.quiz?.allow_multiple ?? false,
      quiz_options: subLesson?.quiz?.options?.map((option) => ({
        option_key: option.option_key,
        body: option.body,
        is_correct: option.is_correct,
      })) ?? [
        {
          option_key: crypto.randomUUID(),
          body: "",
          is_correct: false,
        },
      ],
    });
    setSubLessonDialog({
      mode: subLesson ? "edit" : "create",
      lesson,
      subLesson,
    });
  };

  const closeSubLessonDialog = async () => {
    setSubLessonDialog(null);
    setVideoDialogOpen(false);
    await releaseLease();
  };

  const saveSubLesson = async () => {
    if (!subLessonDialog) {
      return;
    }
    const payload = {
      lesson_id: subLessonForm.lesson_id,
      expected_row_version: subLessonForm.expected_row_version,
      title: subLessonForm.title,
      kind: subLessonForm.kind,
      is_preview: subLessonForm.is_preview,
      video:
        subLessonForm.kind === "VIDEO" && subLessonForm.video_file_id
          ? {
              media_file_id: subLessonForm.video_file_id,
              media_url: subLessonForm.video_url || undefined,
            }
          : undefined,
      text:
        subLessonForm.kind === "TEXT"
          ? { content_delta: subLessonForm.text_delta }
          : undefined,
      quiz:
        subLessonForm.kind === "QUIZ"
          ? {
              prompt: subLessonForm.quiz_prompt,
              allow_multiple: subLessonForm.allow_multiple,
              options: subLessonForm.quiz_options,
            }
          : undefined,
    };
    try {
      if (subLessonDialog.mode === "create") {
        await createCourseSubLessonService(courseId, payload);
      } else if (subLessonDialog.subLesson) {
        await updateCourseSubLessonService(
          courseId,
          subLessonDialog.subLesson.id,
          payload,
        );
      }
      toast.success(t("itemSaved"));
      await closeSubLessonDialog();
      await refreshDetail();
    } catch {
      toast.error(t("itemSaveError"));
    }
  };

  const toggleSelection = (key: CourseSelectionKey, value: number) => {
    setBasicInfo((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [key]: [...next] };
    });
  };

  const handleAddCollaborator = async () => {
    const userId = Number(collaboratorUserId);
    if (!userId) {
      return;
    }
    setIsSubmittingCollaborator(true);
    try {
      await addCourseCollaboratorService(courseId, {
        user_id: userId,
        role: "EDITOR",
      });
      toast.success(t("collaboratorAdded"));
      setCollaboratorUserId("");
      await refreshDetail();
    } catch {
      toast.error(t("collaboratorAddError"));
    } finally {
      setIsSubmittingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator: CourseCollaborator) => {
    try {
      await removeCourseCollaboratorService(courseId, collaborator.user_id);
      toast.success(t("collaboratorRemoved"));
      await refreshDetail();
    } catch {
      toast.error(t("collaboratorRemoveError"));
    }
  };

  const handleSubmitReview = async () => {
    try {
      await submitCourseReviewService(courseId);
      toast.success(t("submitted"));
      await refreshDetail();
    } catch {
      toast.error(t("submitError"));
    }
  };

  const handleReopenDraft = async () => {
    try {
      await reopenCourseDraftService(courseId);
      toast.success(t("reopened"));
      await refreshDetail();
    } catch {
      toast.error(t("reopenError"));
    }
  };

  return {
    activeTab,
    setActiveTab,
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
    collaboratorUserId,
    setCollaboratorUserId,
    isSubmittingCollaborator,
    videoDialogOpen,
    setVideoDialogOpen,
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeSelection,
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
    handleAddCollaborator,
    handleRemoveCollaborator,
    handleSubmitReview,
    handleReopenDraft,
    refreshDetail,
  };
}
