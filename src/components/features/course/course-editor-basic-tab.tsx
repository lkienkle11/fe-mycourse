import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import { FieldError } from "@/components/shared/field-error";
import { ImageFileField } from "@/components/shared/image-file-field";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { resolveValidationMessage } from "@/lib/utils/validation-message";
import {
  type CourseBasicInfoValues,
  courseBasicInfoSchema,
} from "@/schema/course";
import type { CourseBasicInfoForm, CourseSelectionKey } from "@/types/course";
import type {
  CourseOutcome,
  CourseSkill,
  CourseTopic,
  SlugStatusTaxonomy,
} from "@/types/taxonomy";

type CourseBasicInfoTabProps = {
  editable: boolean;
  basicInfo: CourseBasicInfoForm;
  setBasicInfo: Dispatch<SetStateAction<CourseBasicInfoForm>>;
  levelRows: SlugStatusTaxonomy[];
  topicRows: CourseTopic[];
  tagRows: SlugStatusTaxonomy[];
  skillRows: CourseSkill[];
  outcomeRows: CourseOutcome[];
  tagSelection: Set<number>;
  skillSelection: Set<number>;
  outcomeSelection: Set<number>;
  onToggleSelection: (key: CourseSelectionKey, value: number) => void;
  isSavingBasicInfo: boolean;
  onSave: (values: CourseBasicInfoValues) => void;
  onOpenThumbnailDialog: () => void;
  onOpenPreviewDialog: () => void;
};

export function CourseBasicInfoTab({
  editable,
  basicInfo,
  setBasicInfo,
  levelRows,
  topicRows,
  tagRows,
  skillRows,
  outcomeRows,
  tagSelection,
  skillSelection,
  outcomeSelection,
  onToggleSelection,
  isSavingBasicInfo,
  onSave,
  onOpenThumbnailDialog,
  onOpenPreviewDialog,
}: CourseBasicInfoTabProps) {
  const tCourse = useTranslations("course");
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.basicInfo");
  const form = useForm<CourseBasicInfoValues>({
    resolver: zodResolver(courseBasicInfoSchema),
    values: basicInfo,
  });

  return (
    <TabsContent value="info" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => onSave(values))}
          >
            {!editable ? (
              <p className="text-sm text-muted-foreground">{t("emptyDraft")}</p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="course-basic-title">
                      {t("titleLabel")}
                    </RequiredLabel>
                    <Input
                      {...field}
                      id="course-basic-title"
                      disabled={!editable}
                      onChange={(event) => {
                        field.onChange(event);
                        setBasicInfo((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }));
                      }}
                    />
                    <FieldError
                      error={fieldState.error}
                      message={resolveValidationMessage(
                        tCourse as unknown as (key: string) => string,
                        fieldState.error?.message,
                      )}
                    />
                  </div>
                )}
              />

              <Controller
                name="short_description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <RequiredLabel
                      htmlFor="course-basic-short-description"
                      required={false}
                    >
                      {t("shortDescriptionLabel")}
                    </RequiredLabel>
                    <Input
                      {...field}
                      id="course-basic-short-description"
                      disabled={!editable}
                      onChange={(event) => {
                        field.onChange(event);
                        setBasicInfo((prev) => ({
                          ...prev,
                          short_description: event.target.value,
                        }));
                      }}
                    />
                    <FieldError
                      error={fieldState.error}
                      message={resolveValidationMessage(
                        tCourse as unknown as (key: string) => string,
                        fieldState.error?.message,
                      )}
                    />
                  </div>
                )}
              />
            </div>

            <Controller
              name="about_course"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <RequiredLabel htmlFor="course-basic-about" required={false}>
                    {t("aboutLabel")}
                  </RequiredLabel>
                  <Textarea
                    {...field}
                    id="course-basic-about"
                    rows={6}
                    disabled={!editable}
                    onChange={(event) => {
                      field.onChange(event);
                      setBasicInfo((prev) => ({
                        ...prev,
                        about_course: event.target.value,
                      }));
                    }}
                  />
                </div>
              )}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <ImageFileField
                label={t("thumbnailLabel")}
                hint={t("thumbnailHint")}
                browseLabel={t("browseImages")}
                clearLabel={t("clear")}
                previewAlt={t("thumbnailAlt")}
                noImageSelectedLabel={t("noImage")}
                imageFileId={basicInfo.thumbnail_file_id}
                previewUrl={basicInfo.thumbnail_url}
                onBrowse={onOpenThumbnailDialog}
                onClear={() =>
                  setBasicInfo((prev) => ({
                    ...prev,
                    thumbnail_file_id: "",
                    thumbnail_url: "",
                  }))
                }
                hiddenInput={
                  <input
                    type="hidden"
                    name="thumbnail_file_id"
                    value={basicInfo.thumbnail_file_id}
                    readOnly
                  />
                }
              />

              <div className="space-y-2">
                <RequiredLabel required={false}>
                  {t("previewVideoLabel")}
                </RequiredLabel>
                <div className="rounded-md border p-3 text-sm">
                  {basicInfo.preview_video_file_id ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {basicInfo.preview_video_file_id}
                      </div>
                      <div className="truncate text-muted-foreground">
                        {basicInfo.preview_video_url ||
                          tCommon("videoSelected")}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {tCommon("noPreviewVideo")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onOpenPreviewDialog}
                  >
                    {t("browseVideos")}
                  </Button>
                  {basicInfo.preview_video_file_id ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBasicInfo((prev) => ({
                          ...prev,
                          preview_video_file_id: "",
                          preview_video_url: "",
                        }))
                      }
                    >
                      {t("clear")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Controller
                name="course_level_id"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <RequiredLabel required={false}>
                      {t("courseLevelLabel")}
                    </RequiredLabel>
                    <Select
                      value={field.value || "none"}
                      disabled={!editable}
                      onValueChange={(value) => {
                        const nextValue = value === "none" ? "" : value;
                        field.onChange(nextValue);
                        setBasicInfo((prev) => ({
                          ...prev,
                          course_level_id: nextValue,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("noLevel")}</SelectItem>
                        {levelRows.map((row) => (
                          <SelectItem key={row.id} value={String(row.id)}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                name="course_topic_id"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <RequiredLabel required={false}>
                      {t("courseTopicLabel")}
                    </RequiredLabel>
                    <Select
                      value={field.value || "none"}
                      disabled={!editable}
                      onValueChange={(value) => {
                        const nextValue = value === "none" ? "" : value;
                        field.onChange(nextValue);
                        setBasicInfo((prev) => ({
                          ...prev,
                          course_topic_id: nextValue,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTopic")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("noTopic")}</SelectItem>
                        {topicRows.map((row) => (
                          <SelectItem key={row.id} value={String(row.id)}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <SelectionPanel
                title={t("tagsTitle")}
                rows={tagRows.map((row) => ({ id: row.id, label: row.name }))}
                selected={tagSelection}
                disabled={!editable}
                onToggle={(id) => onToggleSelection("tag_ids", id)}
              />
              <SelectionPanel
                title={t("skillsTitle")}
                rows={skillRows.map((row) => ({
                  id: row.id,
                  label: row.name,
                }))}
                selected={skillSelection}
                disabled={!editable}
                onToggle={(id) => onToggleSelection("skill_ids", id)}
              />
              <SelectionPanel
                title={t("outcomesTitle")}
                rows={outcomeRows.map((row) => ({
                  id: row.id,
                  label: row.short_description,
                }))}
                selected={outcomeSelection}
                disabled={!editable}
                onToggle={(id) => onToggleSelection("outcome_ids", id)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!editable || isSavingBasicInfo}>
                {isSavingBasicInfo ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function SelectionPanel({
  title,
  rows,
  selected,
  disabled,
  onToggle,
}: {
  title: string;
  rows: Array<{ id: number; label: string }>;
  selected: Set<number>;
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="min-w-0 space-y-2 rounded-md border p-3">
      <div className="font-medium">{title}</div>
      <div className="scrollbar-app max-h-60 space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div key={row.id} className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={selected.has(row.id)}
              disabled={disabled}
              onCheckedChange={() => onToggle(row.id)}
            />
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
