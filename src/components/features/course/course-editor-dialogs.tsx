import { useTranslations } from "next-intl";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { MediaCollectionDialog } from "@/components/features/media";
import { DeltaEditor } from "@/components/shared/delta-editor";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeltaEditorMediaHandlers } from "@/hooks";
import {
  applyQuizAllowMultipleChange,
  applyQuizOptionCorrectChange,
} from "@/lib/utils/course";
import { buildDurationUnits, formatDurationMs } from "@/lib/utils/duration";
import { newV7 } from "@/lib/utils/uuid";
import type {
  CourseBasicInfoForm,
  CourseLessonDialogState,
  CourseLessonFormState,
  CourseOutlineItemKind,
  CourseSectionDialogState,
  CourseSectionFormState,
  CourseSubLessonDialogState,
  CourseSubLessonFormState,
  CourseSubLessonKind,
} from "@/types/course";
import type { MediaFile } from "@/types/media";

type CourseOutlineItemDialogProps = {
  open: boolean;
  kind: CourseOutlineItemKind;
  mode: "create" | "edit";
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onClose: () => void;
  onSave: () => void;
};

function CourseOutlineItemDialog({
  open,
  kind,
  mode,
  title,
  body,
  onTitleChange,
  onBodyChange,
  onClose,
  onSave,
}: CourseOutlineItemDialogProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.dialogs");
  const titleKey =
    kind === "section"
      ? mode === "create"
        ? "sectionCreateTitle"
        : "sectionEditTitle"
      : mode === "create"
        ? "lessonCreateTitle"
        : "lessonEditTitle";
  const bodyLabel =
    kind === "section" ? t("descriptionLabel") : t("summaryLabel");
  const fieldId = `${kind}-${mode}-title`;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="scrollbar-app max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t(titleKey)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor={fieldId}>{t("titleLabel")}</RequiredLabel>
            <Input
              id={fieldId}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </div>
          <DeltaEditor
            value={body}
            label={bodyLabel}
            required
            allowMediaEmbed={false}
            surfaceClassName="max-h-[320px]"
            onChange={onBodyChange}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={onSave}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CourseSectionDialogProps = {
  sectionDialog: CourseSectionDialogState | null;
  sectionForm: CourseSectionFormState;
  setSectionForm: Dispatch<SetStateAction<CourseSectionFormState>>;
  onClose: () => void;
  onSave: () => void;
};

export function CourseSectionDialog({
  sectionDialog,
  sectionForm,
  setSectionForm,
  onClose,
  onSave,
}: CourseSectionDialogProps) {
  return (
    <CourseOutlineItemDialog
      open={Boolean(sectionDialog)}
      kind="section"
      mode={sectionDialog?.mode ?? "create"}
      title={sectionForm.title}
      body={sectionForm.description}
      onTitleChange={(nextTitle) =>
        setSectionForm((prev) => ({ ...prev, title: nextTitle }))
      }
      onBodyChange={(nextBody) =>
        setSectionForm((prev) => ({ ...prev, description: nextBody }))
      }
      onClose={onClose}
      onSave={onSave}
    />
  );
}

type CourseLessonDialogProps = {
  lessonDialog: CourseLessonDialogState | null;
  lessonForm: CourseLessonFormState;
  setLessonForm: Dispatch<SetStateAction<CourseLessonFormState>>;
  onClose: () => void;
  onSave: () => void;
};

export function CourseLessonDialog({
  lessonDialog,
  lessonForm,
  setLessonForm,
  onClose,
  onSave,
}: CourseLessonDialogProps) {
  return (
    <CourseOutlineItemDialog
      open={Boolean(lessonDialog)}
      kind="lesson"
      mode={lessonDialog?.mode ?? "create"}
      title={lessonForm.title}
      body={lessonForm.summary}
      onTitleChange={(nextTitle) =>
        setLessonForm((prev) => ({ ...prev, title: nextTitle }))
      }
      onBodyChange={(nextBody) =>
        setLessonForm((prev) => ({ ...prev, summary: nextBody }))
      }
      onClose={onClose}
      onSave={onSave}
    />
  );
}

type CourseSubLessonDialogProps = {
  subLessonDialog: CourseSubLessonDialogState | null;
  subLessonForm: CourseSubLessonFormState;
  setSubLessonForm: Dispatch<SetStateAction<CourseSubLessonFormState>>;
  onClose: () => void;
  onSave: () => void;
  onOpenVideoDialog: () => void;
};

type SubLessonKindFieldProps = {
  form: CourseSubLessonFormState;
  setForm: Dispatch<SetStateAction<CourseSubLessonFormState>>;
  onOpenVideoDialog: () => void;
  onObjectEmbedded: ReturnType<
    typeof useDeltaEditorMediaHandlers
  >["onObjectEmbedded"];
  onDelete: ReturnType<typeof useDeltaEditorMediaHandlers>["onDelete"];
};

const SUB_LESSON_KINDS_WITH_PREVIEW: CourseSubLessonKind[] = ["VIDEO", "TEXT"];

function subLessonDialogTitle(
  mode: CourseSubLessonDialogState["mode"] | undefined,
  labels: { create: string; edit: string },
): string {
  if (mode === "create") {
    return labels.create;
  }
  return labels.edit;
}

function SubLessonCheckboxField({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={checked}
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function SubLessonDurationFields({
  form,
  setForm,
}: Pick<SubLessonKindFieldProps, "form" | "setForm">) {
  const t = useTranslations("course.editor.dialogs");

  return (
    <div className="space-y-2">
      <RequiredLabel>{t("estimatedDurationLabel")}</RequiredLabel>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="duration-hours"
          >
            {t("durationHours")}
          </label>
          <Input
            id="duration-hours"
            type="number"
            min={0}
            value={form.duration_hours}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                duration_hours: Math.max(0, Number(event.target.value) || 0),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="duration-minutes"
          >
            {t("durationMinutes")}
          </label>
          <Input
            id="duration-minutes"
            type="number"
            min={0}
            max={59}
            value={form.duration_minutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                duration_minutes: Math.max(0, Number(event.target.value) || 0),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="duration-seconds"
          >
            {t("durationSeconds")}
          </label>
          <Input
            id="duration-seconds"
            type="number"
            min={0}
            max={59}
            value={form.duration_seconds}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                duration_seconds: Math.max(0, Number(event.target.value) || 0),
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function SubLessonVideoFields({
  form,
  setForm,
  onOpenVideoDialog,
}: SubLessonKindFieldProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.dialogs");
  const tBasic = useTranslations("course.editor.basicInfo");
  const hasVideo = Boolean(form.video_file_id);
  const previewDurationMs =
    form.video_duration_seconds > 0 ? form.video_duration_seconds * 1000 : 0;
  const durationLabel = formatDurationMs(
    previewDurationMs,
    buildDurationUnits(tCommon),
  );

  return (
    <div className="min-w-0 space-y-2">
      <RequiredLabel>{t("videoFileLabel")}</RequiredLabel>
      <div className="min-w-0 rounded-md border p-3 text-sm">
        {hasVideo ? (
          <div className="min-w-0 space-y-1">
            <div className="break-all font-medium">{form.video_file_id}</div>
            <div className="break-all text-muted-foreground">
              {form.video_url || tCommon("videoSelected")}
            </div>
            {durationLabel ? (
              <div className="text-muted-foreground">
                {t("estimatedDurationLabel")}: {durationLabel}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">{tCommon("noVideoSelected")}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onOpenVideoDialog}>
          {tBasic("browseVideos")}
        </Button>
        {hasVideo ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                video_file_id: "",
                video_url: "",
                video_duration_seconds: 0,
              }))
            }
          >
            {tBasic("clear")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SubLessonTextFields({
  form,
  setForm,
  onObjectEmbedded,
  onDelete,
}: SubLessonKindFieldProps) {
  return (
    <div className="min-w-0 space-y-4">
      <SubLessonDurationFields form={form} setForm={setForm} />
      <DeltaEditor
        className="min-w-0"
        surfaceClassName="max-h-[320px]"
        value={form.text_delta}
        onObjectEmbedded={onObjectEmbedded}
        onDelete={onDelete}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, text_delta: value }))
        }
      />
    </div>
  );
}

function SubLessonQuizFields({
  form,
  setForm,
}: Pick<SubLessonKindFieldProps, "form" | "setForm">) {
  const t = useTranslations("course.editor.dialogs");

  return (
    <div className="min-w-0 space-y-4">
      <SubLessonDurationFields form={form} setForm={setForm} />
      <div className="space-y-2">
        <RequiredLabel htmlFor="quiz-prompt">{t("promptLabel")}</RequiredLabel>
        <Textarea
          id="quiz-prompt"
          rows={3}
          className="min-w-0"
          value={form.quiz_prompt}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, quiz_prompt: event.target.value }))
          }
        />
      </div>
      <SubLessonCheckboxField
        checked={form.allow_multiple}
        onCheckedChange={(checked) =>
          setForm((prev) => ({
            ...prev,
            ...applyQuizAllowMultipleChange(checked, prev.quiz_options),
          }))
        }
        label={t("allowMultiple")}
      />

      <div className="min-w-0 space-y-3">
        {form.quiz_options.map((option, index) => (
          <div
            key={option.option_key}
            className="min-w-0 rounded-md border p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <RequiredLabel>
                {t("optionLabel", { index: String(index + 1) })}
              </RequiredLabel>
              {form.quiz_options.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      quiz_options: prev.quiz_options.filter(
                        (item) => item.option_key !== option.option_key,
                      ),
                    }))
                  }
                >
                  {t("removeOption")}
                </Button>
              ) : null}
            </div>
            <div className="space-y-3">
              <Input
                className="min-w-0"
                value={option.body}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    quiz_options: prev.quiz_options.map((item) =>
                      item.option_key === option.option_key
                        ? { ...item, body: event.target.value }
                        : item,
                    ),
                  }))
                }
              />
              <SubLessonCheckboxField
                checked={option.is_correct}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    quiz_options: applyQuizOptionCorrectChange(
                      prev.allow_multiple,
                      prev.quiz_options,
                      option.option_key,
                      checked,
                    ),
                  }))
                }
                label={t("correctAnswer")}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              quiz_options: [
                ...prev.quiz_options,
                {
                  option_key: newV7(),
                  body: "",
                  is_correct: false,
                },
              ],
            }))
          }
        >
          {t("addOption")}
        </Button>
      </div>
    </div>
  );
}

const SUB_LESSON_KIND_FIELD_RENDERERS: Record<
  CourseSubLessonKind,
  (props: SubLessonKindFieldProps) => ReactNode
> = {
  VIDEO: SubLessonVideoFields,
  TEXT: SubLessonTextFields,
  QUIZ: SubLessonQuizFields,
};

function SubLessonKindFields(props: SubLessonKindFieldProps) {
  const Renderer = SUB_LESSON_KIND_FIELD_RENDERERS[props.form.kind];
  return <Renderer {...props} />;
}

export function CourseSubLessonDialog({
  subLessonDialog,
  subLessonForm,
  setSubLessonForm,
  onClose,
  onSave,
  onOpenVideoDialog,
}: CourseSubLessonDialogProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.dialogs");
  const { onObjectEmbedded, onDelete } = useDeltaEditorMediaHandlers();
  const showsPreview = SUB_LESSON_KINDS_WITH_PREVIEW.includes(
    subLessonForm.kind,
  );

  return (
    <Dialog
      open={Boolean(subLessonDialog)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="scrollbar-app max-h-[90vh] max-w-3xl overflow-x-hidden overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle>
            {subLessonDialogTitle(subLessonDialog?.mode, {
              create: t("itemCreateTitle"),
              edit: t("itemEditTitle"),
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {subLessonDialogTitle(subLessonDialog?.mode, {
              create: t("itemCreateTitle"),
              edit: t("itemEditTitle"),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-4 overflow-x-hidden">
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <RequiredLabel htmlFor="sublesson-title">
                {t("titleLabel")}
              </RequiredLabel>
              <Input
                id="sublesson-title"
                className="min-w-0"
                value={subLessonForm.title}
                onChange={(event) =>
                  setSubLessonForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="min-w-0 space-y-2">
              <RequiredLabel>{t("lessonItemTypeLabel")}</RequiredLabel>
              <Select
                value={subLessonForm.kind}
                onValueChange={(value) =>
                  setSubLessonForm((prev) => ({
                    ...prev,
                    kind: value as CourseSubLessonKind,
                    is_preview: value === "QUIZ" ? false : prev.is_preview,
                  }))
                }
              >
                <SelectTrigger className="min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">
                    {tCommon("subLessonKind.VIDEO")}
                  </SelectItem>
                  <SelectItem value="QUIZ">
                    {tCommon("subLessonKind.QUIZ")}
                  </SelectItem>
                  <SelectItem value="TEXT">
                    {tCommon("subLessonKind.TEXT")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showsPreview ? (
            <SubLessonCheckboxField
              checked={subLessonForm.is_preview}
              onCheckedChange={(checked) =>
                setSubLessonForm((prev) => ({
                  ...prev,
                  is_preview: checked,
                }))
              }
              label={t("previewCheckbox")}
            />
          ) : null}

          <SubLessonKindFields
            form={subLessonForm}
            setForm={setSubLessonForm}
            onOpenVideoDialog={onOpenVideoDialog}
            onObjectEmbedded={onObjectEmbedded}
            onDelete={onDelete}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" onClick={onSave}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CourseMediaDialogsProps = {
  thumbnailDialogOpen: boolean;
  setThumbnailDialogOpen: Dispatch<SetStateAction<boolean>>;
  previewDialogOpen: boolean;
  setPreviewDialogOpen: Dispatch<SetStateAction<boolean>>;
  basicInfo: CourseBasicInfoForm;
  setBasicInfo: Dispatch<SetStateAction<CourseBasicInfoForm>>;
  videoDialogOpen: boolean;
  setVideoDialogOpen: Dispatch<SetStateAction<boolean>>;
  subLessonForm: CourseSubLessonFormState;
  setSubLessonForm: Dispatch<SetStateAction<CourseSubLessonFormState>>;
};

export function CourseMediaDialogs({
  thumbnailDialogOpen,
  setThumbnailDialogOpen,
  previewDialogOpen,
  setPreviewDialogOpen,
  basicInfo,
  setBasicInfo,
  videoDialogOpen,
  setVideoDialogOpen,
  subLessonForm,
  setSubLessonForm,
}: CourseMediaDialogsProps) {
  return (
    <>
      <MediaCollectionDialog
        open={thumbnailDialogOpen}
        onOpenChange={setThumbnailDialogOpen}
        visibleTabs={["image"]}
        defaultTab="image"
        selectionMode="single"
        selectedFileId={basicInfo.thumbnail_file_id}
        onSelect={(file: MediaFile) =>
          setBasicInfo((prev) => ({
            ...prev,
            thumbnail_file_id: file.id ?? "",
            thumbnail_url: file.url,
          }))
        }
      />

      <MediaCollectionDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        visibleTabs={["video"]}
        defaultTab="video"
        selectionMode="single"
        selectedFileId={basicInfo.preview_video_file_id}
        onSelect={(file: MediaFile) =>
          setBasicInfo((prev) => ({
            ...prev,
            preview_video_file_id: file.id ?? "",
            preview_video_url: file.url,
          }))
        }
      />

      <MediaCollectionDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        visibleTabs={["video"]}
        defaultTab="video"
        selectionMode="single"
        selectedFileId={subLessonForm.video_file_id}
        onSelect={(file: MediaFile) =>
          setSubLessonForm((prev) => ({
            ...prev,
            video_file_id: file.id ?? "",
            video_url: file.url,
            video_duration_seconds: file.duration ?? 0,
          }))
        }
      />
    </>
  );
}
