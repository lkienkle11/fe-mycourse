"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { KeyedMutator } from "swr";
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
import { useCourseOutlineReorder } from "@/hooks/course/use-course-outline-reorder";
import { toastApiError } from "@/lib/utils/api-error";
import {
  buildSubLessonEstimatedDurationPayload,
  createCourseBasicInfoState,
  createCourseSubLessonFormState,
  rootOutlineStableId,
  selectedIdsToMap,
  toUpdateCourseBasicInfoPayload,
  validateCourseSubmitReadiness,
  validateSubLessonDurationForm,
  validateSubLessonFormContent,
} from "@/lib/utils/course";
import { createEmptyDeltaString } from "@/lib/utils/course-delta";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  courseBasicInfoSchema,
  courseCollaboratorSchema,
  courseLessonSchema,
  courseSectionSchema,
  courseSubLessonSchema,
} from "@/schema/course";
import type {
  CourseBasicInfoForm,
  CourseCollaborator,
  CourseDetail,
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
  courseId: string;
  courseDetail?: CourseDetail;
  activeVersion?: CourseVersion;
  editableVersion?: CourseVersion;
  mutateDetail: KeyedMutator<CourseDetail>;
};

function useCourseBasicInfoState(activeVersion?: CourseVersion) {
  const [basicInfo, setBasicInfo] = useState<CourseBasicInfoForm>(() =>
    createCourseBasicInfoState(activeVersion),
  );
  const syncedVersionIdRef = useRef(activeVersion?.id ?? "");
  const activeVersionId = activeVersion?.id ?? "";

  if (syncedVersionIdRef.current !== activeVersionId) {
    syncedVersionIdRef.current = activeVersionId;
    setBasicInfo(createCourseBasicInfoState(activeVersion));
  }

  const tagSelection = useMemo(
    () => selectedIdsToMap(basicInfo.tag_ids),
    [basicInfo.tag_ids],
  );
  const skillSelection = useMemo(
    () => selectedIdsToMap(basicInfo.skill_ids),
    [basicInfo.skill_ids],
  );
  const outcomeId = basicInfo.outcome_ids[0] ?? "";

  const toggleSelection = (key: CourseSelectionKey, value: string) => {
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

  const setOutcomeId = (value: string) => {
    setBasicInfo((prev) => ({
      ...prev,
      outcome_ids: value ? [value] : [],
    }));
  };

  return {
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeId,
    setOutcomeId,
    toggleSelection,
  };
}

function useCourseCollaboratorState() {
  const [collaboratorUserId, setCollaboratorUserId] = useState("");
  const [isSubmittingCollaborator, setIsSubmittingCollaborator] =
    useState(false);

  return {
    collaboratorUserId,
    setCollaboratorUserId,
    isSubmittingCollaborator,
    setIsSubmittingCollaborator,
  };
}

function useCourseOutlineDialogState() {
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [sectionDialog, setSectionDialog] =
    useState<CourseSectionDialogState | null>(null);
  const [lessonDialog, setLessonDialog] =
    useState<CourseLessonDialogState | null>(null);
  const [subLessonDialog, setSubLessonDialog] =
    useState<CourseSubLessonDialogState | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState<CourseSectionFormState>({
    title: "",
    description: createEmptyDeltaString(),
    expected_row_version: 0,
  });
  const [lessonForm, setLessonForm] = useState<CourseLessonFormState>({
    section_id: "",
    title: "",
    summary: createEmptyDeltaString(),
    expected_row_version: 0,
  });
  const [subLessonForm, setSubLessonForm] = useState<CourseSubLessonFormState>(
    () => createCourseSubLessonFormState(),
  );

  return {
    thumbnailDialogOpen,
    setThumbnailDialogOpen,
    previewDialogOpen,
    setPreviewDialogOpen,
    sectionDialog,
    setSectionDialog,
    sectionForm,
    setSectionForm,
    lessonDialog,
    setLessonDialog,
    lessonForm,
    setLessonForm,
    subLessonDialog,
    setSubLessonDialog,
    subLessonForm,
    setSubLessonForm,
    videoDialogOpen,
    setVideoDialogOpen,
  };
}

function useCourseLeaseState({
  courseId,
  leaseVersionId,
  t,
  tErrors,
}: {
  courseId: string;
  leaseVersionId: string;
  t: ReturnType<typeof useTranslations<"course.editor.toast">>;
  tErrors: ReturnType<typeof useTranslations<"errors.codes">>;
}) {
  const [activeLease, setActiveLease] = useState<CourseLease | null>(null);

  useEffect(() => {
    if (!activeLease) {
      return;
    }

    const timer = window.setInterval(() => {
      void heartbeatCourseLeaseService(courseId, activeLease.lease_token).catch(
        (error) => {
          toastApiError(tErrors, error);
          setActiveLease(null);
        },
      );
    }, 120000);

    return () => window.clearInterval(timer);
  }, [activeLease, courseId, tErrors]);

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
    } catch (error) {
      toastApiError(tErrors, error);
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
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      await releaseLease();
    }
  };

  return {
    activeLease,
    acquireLease,
    releaseLease,
    withEphemeralLease,
  };
}

export function useCourseEditorState({
  courseId,
  courseDetail,
  activeVersion,
  editableVersion,
  mutateDetail,
}: UseCourseEditorStateParams) {
  const t = useTranslations("course.editor.toast");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const [isPreparingDraft, setIsPreparingDraft] = useState(false);
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const leaseVersionId = editableVersion?.id ?? "";
  const {
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeId,
    setOutcomeId,
    toggleSelection,
  } = useCourseBasicInfoState(activeVersion);
  const {
    collaboratorUserId,
    setCollaboratorUserId,
    isSubmittingCollaborator,
    setIsSubmittingCollaborator,
  } = useCourseCollaboratorState();
  const {
    thumbnailDialogOpen,
    setThumbnailDialogOpen,
    previewDialogOpen,
    setPreviewDialogOpen,
    sectionDialog,
    setSectionDialog,
    sectionForm,
    setSectionForm,
    lessonDialog,
    setLessonDialog,
    lessonForm,
    setLessonForm,
    subLessonDialog,
    setSubLessonDialog,
    subLessonForm,
    setSubLessonForm,
    videoDialogOpen,
    setVideoDialogOpen,
  } = useCourseOutlineDialogState();
  const { acquireLease, releaseLease, withEphemeralLease } =
    useCourseLeaseState({
      courseId,
      leaseVersionId,
      t,
      tErrors,
    });
  const {
    handleReorderSections,
    handleReverseSections,
    handleReorderLessons,
    handleReorderSubLessons,
  } = useCourseOutlineReorder({
    courseId,
    courseDetail,
    mutateDetail,
    acquireLease,
    releaseLease,
    tSuccess: t,
    tErrors,
  });

  const refreshDetail = async () => {
    await mutateDetail();
  };

  const handlePrepareDraft = async () => {
    setIsPreparingDraft(true);
    try {
      await prepareCourseDraftService(courseId);
      toast.success(t("draftPrepared"));
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsPreparingDraft(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!editableVersion) {
      toast.error(t("draftRequiredInfo"));
      return;
    }
    const parsed = courseBasicInfoSchema.safeParse(basicInfo);
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "title");
      return;
    }
    setIsSavingBasicInfo(true);
    try {
      await updateCourseBasicInfoService(
        courseId,
        toUpdateCourseBasicInfoPayload(basicInfo),
      );
      toast.success(t("basicInfoSaved"));
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
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
    const parsed = courseSectionSchema.safeParse({
      title: sectionForm.title,
      description: sectionForm.description,
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "sectionTitle");
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
    } catch (error) {
      toastApiError(tErrors, error);
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
    const parsed = courseLessonSchema.safeParse({
      title: lessonForm.title,
      summary: lessonForm.summary,
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "lessonTitle");
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
    } catch (error) {
      toastApiError(tErrors, error);
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
      ...createCourseSubLessonFormState(lesson.id, subLesson),
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
    const parsed = courseSubLessonSchema.safeParse({
      title: subLessonForm.title.trim(),
      kind: subLessonForm.kind,
    });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "subLessonTitle");
      return;
    }
    const contentIssueKey = validateSubLessonFormContent({
      kind: subLessonForm.kind,
      video_file_id: subLessonForm.video_file_id,
      text_delta: subLessonForm.text_delta,
      allow_multiple: subLessonForm.allow_multiple,
      quiz_prompt: subLessonForm.quiz_prompt,
      quiz_options: subLessonForm.quiz_options,
    });
    if (contentIssueKey) {
      toast.error(
        tValidation(contentIssueKey as Parameters<typeof tValidation>[0]),
      );
      return;
    }
    if (!validateSubLessonDurationForm(subLessonForm)) {
      toast.error(tValidation("subLessonDurationInvalid"));
      return;
    }
    const estimatedDurationMs =
      buildSubLessonEstimatedDurationPayload(subLessonForm);
    const isPreview =
      subLessonForm.kind === "QUIZ" ? false : subLessonForm.is_preview;
    const payload = {
      lesson_id: subLessonForm.lesson_id,
      expected_row_version: subLessonForm.expected_row_version,
      title: subLessonForm.title,
      kind: subLessonForm.kind,
      is_preview: isPreview,
      ...(estimatedDurationMs !== undefined
        ? { estimated_duration_ms: estimatedDurationMs }
        : {}),
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
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  const handleAddCollaborator = async () => {
    const parsed = courseCollaboratorSchema.safeParse({
      user_id: collaboratorUserId,
    });
    if (!parsed.success) {
      toast.error(tValidation("collaboratorUserId"));
      return;
    }
    const userId = parsed.data.user_id;
    setIsSubmittingCollaborator(true);
    try {
      await addCourseCollaboratorService(courseId, {
        user_id: userId,
        role: "EDITOR",
      });
      toast.success(t("collaboratorAdded"));
      setCollaboratorUserId("");
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSubmittingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator: CourseCollaborator) => {
    try {
      await removeCourseCollaboratorService(courseId, collaborator.user_id);
      toast.success(t("collaboratorRemoved"));
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  const handleSubmitReview = async () => {
    if (!courseDetail) {
      toast.error(tValidation("submitBasicInfoIncomplete"));
      return;
    }
    const issues = validateCourseSubmitReadiness(courseDetail);
    if (issues?.length) {
      toastValidationError(tValidation, issues, "submitBasicInfoIncomplete");
      return;
    }
    try {
      await submitCourseReviewService(courseId);
      toast.success(t("submitted"));
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  const handleReopenDraft = async () => {
    try {
      await reopenCourseDraftService(courseId);
      toast.success(t("reopened"));
      await refreshDetail();
    } catch (error) {
      toastApiError(tErrors, error);
    }
  };

  return {
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
    handleAddCollaborator,
    handleRemoveCollaborator,
    handleSubmitReview,
    handleReopenDraft,
    refreshDetail,
    handleReorderSections,
    handleReverseSections,
    handleReorderLessons,
    handleReorderSubLessons,
  };
}
