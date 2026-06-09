"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { toastApiError } from "@/lib/utils/api-error";
import {
  createCourseBasicInfoState,
  createCourseSubLessonFormState,
  rootOutlineStableId,
  selectedIdsToMap,
  toUpdateCourseBasicInfoPayload,
} from "@/lib/utils/course";
import { toastValidationError } from "@/lib/utils/validation-message";
import {
  type CourseBasicInfoValues,
  courseCollaboratorSchema,
  courseLessonSchema,
  courseQuizOptionSchema,
  courseSectionSchema,
  courseSubLessonSchema,
} from "@/schema/course";
import type {
  CourseBasicInfoForm,
  CourseCollaborator,
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

function useCourseBasicInfoState(activeVersion?: CourseVersion) {
  const [basicInfo, setBasicInfo] = useState<CourseBasicInfoForm>(() =>
    createCourseBasicInfoState(activeVersion),
  );
  const syncedVersionIdRef = useRef(activeVersion?.id ?? 0);
  const activeVersionId = activeVersion?.id ?? 0;

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
  const outcomeSelection = useMemo(
    () => selectedIdsToMap(basicInfo.outcome_ids),
    [basicInfo.outcome_ids],
  );

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

  return {
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeSelection,
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
    description: "",
    expected_row_version: 0,
  });
  const [lessonForm, setLessonForm] = useState<CourseLessonFormState>({
    section_id: 0,
    title: "",
    summary: "",
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
  courseId: number;
  leaseVersionId: number;
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
  activeVersion,
  editableVersion,
  mutate,
}: UseCourseEditorStateParams) {
  const t = useTranslations("course.editor.toast");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const [isPreparingDraft, setIsPreparingDraft] = useState(false);
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const leaseVersionId = editableVersion?.id ?? 0;
  const {
    basicInfo,
    setBasicInfo,
    tagSelection,
    skillSelection,
    outcomeSelection,
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

  const refreshDetail = async () => {
    await mutate();
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

  const handleSaveBasicInfo = async (values: CourseBasicInfoValues) => {
    if (!editableVersion) {
      toast.error(t("draftRequiredInfo"));
      return;
    }
    setIsSavingBasicInfo(true);
    try {
      await updateCourseBasicInfoService(
        courseId,
        toUpdateCourseBasicInfoPayload(values),
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
      title: sectionForm.title.trim(),
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
      title: lessonForm.title.trim(),
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
    if (subLessonForm.kind === "VIDEO" && !subLessonForm.video_file_id) {
      toast.error(tValidation("videoMediaRequired"));
      return;
    }
    if (subLessonForm.kind === "QUIZ") {
      const parsedQuiz = courseQuizOptionSchema.safeParse({
        prompt: subLessonForm.quiz_prompt,
        options: subLessonForm.quiz_options,
      });
      if (!parsedQuiz.success) {
        toastValidationError(
          tValidation,
          parsedQuiz.error.issues,
          "quizPrompt",
        );
        return;
      }
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
    const userId = Number(collaboratorUserId);
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
