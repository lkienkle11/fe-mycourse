import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { CourseDeltaEditor } from "@/components/features/course/course-delta-editor";
import { MediaCollectionDialog } from "@/components/features/media";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CourseBasicInfoForm,
  CourseLessonDialogState,
  CourseLessonFormState,
  CourseSectionDialogState,
  CourseSectionFormState,
  CourseSubLessonDialogState,
  CourseSubLessonFormState,
  CourseSubLessonKind,
} from "@/types/course";
import type { MediaFile } from "@/types/media";

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
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.dialogs");
  return (
    <Dialog
      open={Boolean(sectionDialog)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sectionDialog?.mode === "create"
              ? t("sectionCreateTitle")
              : t("sectionEditTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("titleLabel")}</Label>
            <Input
              value={sectionForm.title}
              onChange={(event) =>
                setSectionForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("descriptionLabel")}</Label>
            <Textarea
              rows={4}
              value={sectionForm.description}
              onChange={(event) =>
                setSectionForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
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
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.dialogs");
  return (
    <Dialog
      open={Boolean(lessonDialog)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lessonDialog?.mode === "create"
              ? t("lessonCreateTitle")
              : t("lessonEditTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("titleLabel")}</Label>
            <Input
              value={lessonForm.title}
              onChange={(event) =>
                setLessonForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("summaryLabel")}</Label>
            <Textarea
              rows={4}
              value={lessonForm.summary}
              onChange={(event) =>
                setLessonForm((prev) => ({
                  ...prev,
                  summary: event.target.value,
                }))
              }
            />
          </div>
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

type CourseSubLessonDialogProps = {
  subLessonDialog: CourseSubLessonDialogState | null;
  subLessonForm: CourseSubLessonFormState;
  setSubLessonForm: Dispatch<SetStateAction<CourseSubLessonFormState>>;
  onClose: () => void;
  onSave: () => void;
  onOpenVideoDialog: () => void;
};

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
  const tBasic = useTranslations("course.editor.basicInfo");
  return (
    <Dialog
      open={Boolean(subLessonDialog)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="scrollbar-app max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subLessonDialog?.mode === "create"
              ? t("itemCreateTitle")
              : t("itemEditTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("titleLabel")}</Label>
              <Input
                value={subLessonForm.title}
                onChange={(event) =>
                  setSubLessonForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("lessonItemTypeLabel")}</Label>
              <Select
                value={subLessonForm.kind}
                onValueChange={(value) =>
                  setSubLessonForm((prev) => ({
                    ...prev,
                    kind: value as CourseSubLessonKind,
                  }))
                }
              >
                <SelectTrigger>
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

          <div className="flex items-center gap-2">
            <Checkbox
              checked={subLessonForm.is_preview}
              onCheckedChange={(checked) =>
                setSubLessonForm((prev) => ({
                  ...prev,
                  is_preview: checked === true,
                }))
              }
            />
            <span className="text-sm">{t("previewCheckbox")}</span>
          </div>

          {subLessonForm.kind === "VIDEO" ? (
            <div className="space-y-2">
              <Label>{t("videoFileLabel")}</Label>
              <div className="rounded-md border p-3 text-sm">
                {subLessonForm.video_file_id ? (
                  <div className="space-y-1">
                    <div className="font-medium">
                      {subLessonForm.video_file_id}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {subLessonForm.video_url || tCommon("videoSelected")}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {tCommon("noVideoSelected")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onOpenVideoDialog}
                >
                  {tBasic("browseVideos")}
                </Button>
                {subLessonForm.video_file_id ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSubLessonForm((prev) => ({
                        ...prev,
                        video_file_id: "",
                        video_url: "",
                      }))
                    }
                  >
                    {tBasic("clear")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {subLessonForm.kind === "TEXT" ? (
            <CourseDeltaEditor
              value={subLessonForm.text_delta}
              onChange={(value) =>
                setSubLessonForm((prev) => ({ ...prev, text_delta: value }))
              }
            />
          ) : null}

          {subLessonForm.kind === "QUIZ" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("promptLabel")}</Label>
                <Textarea
                  rows={3}
                  value={subLessonForm.quiz_prompt}
                  onChange={(event) =>
                    setSubLessonForm((prev) => ({
                      ...prev,
                      quiz_prompt: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={subLessonForm.allow_multiple}
                  onCheckedChange={(checked) =>
                    setSubLessonForm((prev) => ({
                      ...prev,
                      allow_multiple: checked === true,
                    }))
                  }
                />
                <span className="text-sm">{t("allowMultiple")}</span>
              </div>

              <div className="space-y-3">
                {subLessonForm.quiz_options.map((option, index) => (
                  <div
                    key={option.option_key}
                    className="rounded-md border p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Label>
                        {t("optionLabel", { index: String(index + 1) })}
                      </Label>
                      {subLessonForm.quiz_options.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSubLessonForm((prev) => ({
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
                        value={option.body}
                        onChange={(event) =>
                          setSubLessonForm((prev) => ({
                            ...prev,
                            quiz_options: prev.quiz_options.map((item) =>
                              item.option_key === option.option_key
                                ? { ...item, body: event.target.value }
                                : item,
                            ),
                          }))
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={option.is_correct}
                          onCheckedChange={(checked) =>
                            setSubLessonForm((prev) => ({
                              ...prev,
                              quiz_options: prev.quiz_options.map((item) =>
                                item.option_key === option.option_key
                                  ? { ...item, is_correct: checked === true }
                                  : item,
                              ),
                            }))
                          }
                        />
                        <span className="text-sm">{t("correctAnswer")}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setSubLessonForm((prev) => ({
                      ...prev,
                      quiz_options: [
                        ...prev.quiz_options,
                        {
                          option_key: crypto.randomUUID(),
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
          ) : null}
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
          }))
        }
      />
    </>
  );
}
