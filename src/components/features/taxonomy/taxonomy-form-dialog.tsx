"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  createTaxonomyService,
  updateTaxonomyService,
} from "@/api/callers/taxonomy";
import { MediaCollectionDialog } from "@/components/features/media";
import { FieldError } from "@/components/shared/field-error";
import { ImageFileField } from "@/components/shared/image-file-field";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { PERMISSIONS } from "@/constants/permissions";
import { slugifyName } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import {
  getTaxonomyResourceConfig,
  getTaxonomyTreeFromEntity,
  toTaxonomyTreeWritePayload,
} from "@/lib/utils/taxonomy";
import { resolveValidationMessage } from "@/lib/utils/validation-message";
import {
  type TaxonomyOutcomeValues,
  type TaxonomySlugStatusValues,
  type TaxonomyTopicValues,
  taxonomyOutcomeSchema,
  taxonomySkillSchema,
  taxonomySlugStatusSchema,
  taxonomyTopicSchema,
} from "@/schema/taxonomy";
import type { MediaFile } from "@/types/media";
import type {
  CourseOutcome,
  CourseTopic,
  SlugStatusTaxonomy,
  TaxonomyEntity,
  TaxonomyResourceKey,
  TaxonomyStatus,
  TaxonomyTreeNode,
} from "@/types/taxonomy";
import { TaxonomyDescriptionEditor } from "./taxonomy-description-editor";
import { TaxonomyTreeEditor } from "./taxonomy-tree-editor";

export type TaxonomyFormDialogProps = {
  resourceKey: TaxonomyResourceKey;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TaxonomyEntity | null;
  onSuccess: () => void;
};
export function TaxonomyFormDialog({
  resourceKey,
  mode,
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: TaxonomyFormDialogProps) {
  const t = useTranslations("taxonomy");
  const tForm = useTranslations("taxonomy.form");
  const tMedia = useTranslations("media.picker");
  const tErrors = useTranslations("errors.codes");
  const config = getTaxonomyResourceConfig(resourceKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tree, setTree] = useState<TaxonomyTreeNode[]>([]);
  const [description, setDescription] = useState<string[]>([]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<MediaFile | null>(null);
  const [initialImageFileURL, setInitialImageFileURL] = useState("");

  const schema = useMemo(() => {
    if (resourceKey === "outcomes") return taxonomyOutcomeSchema;
    if (resourceKey === "topics") return taxonomyTopicSchema;
    if (resourceKey === "skills") return taxonomySkillSchema;
    return taxonomySlugStatusSchema;
  }, [resourceKey]);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      status: "ACTIVE" as TaxonomyStatus,
      short_description: "",
      description: [],
      image_file_id: "",
      child_topics: [],
      children: [],
    } as FormValues,
  });

  const syncFormState = useCallback(() => {
    if (resourceKey === "outcomes") {
      const row = initialData as CourseOutcome | undefined;
      form.reset({
        short_description: row?.short_description ?? "",
        description: row?.description ?? [],
        image_file_id: row?.image_file_id ?? "",
        status: row?.status ?? "ACTIVE",
      } as FormValues);
      setDescription(row?.description?.length ? row.description : [""]);
      setImagePreview(null);
      setInitialImageFileURL(row?.image_file_url ?? "");
      return;
    }

    const row = initialData as SlugStatusTaxonomy | undefined;
    form.reset({
      name: row?.name ?? "",
      status: row?.status ?? "ACTIVE",
      image_file_id:
        resourceKey === "topics"
          ? ((initialData as CourseTopic | undefined)?.image_file_id ?? "")
          : "",
    } as FormValues);
    setTree(getTaxonomyTreeFromEntity(resourceKey, initialData));
    setImagePreview(null);
    setInitialImageFileURL(
      resourceKey === "topics"
        ? ((initialData as CourseTopic | undefined)?.image_file_url ?? "")
        : "",
    );
  }, [form, initialData, resourceKey]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      syncFormState();
    }
    onOpenChange(next);
  };

  const imageFileId = useWatch({
    control: form.control,
    name: "image_file_id" as FieldPath<FormValues>,
    defaultValue: "",
  }) as string | undefined;

  const nameValue =
    (useWatch({
      control: form.control,
      name: "name" as FieldPath<FormValues>,
      defaultValue: "",
    }) as string) ?? "";

  const statusValue = useWatch({
    control: form.control,
    name: "status",
    defaultValue: "ACTIVE" as TaxonomyStatus,
  }) as TaxonomyStatus;

  const resourceLabel = t(`resources.${resourceKey}.singular`);
  const dialogTitle =
    mode === "create"
      ? tForm("createTitle", { resource: resourceLabel })
      : tForm("editTitle", { resource: resourceLabel });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (resourceKey === "outcomes") {
        const payload = {
          short_description: (values as TaxonomyOutcomeValues)
            .short_description,
          description: description.filter((line) => line.trim().length > 0),
          image_file_id:
            (values as TaxonomyOutcomeValues).image_file_id || undefined,
          status: values.status as TaxonomyStatus,
        };
        if (mode === "create") {
          await createTaxonomyService("outcomes", payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService("outcomes", initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      } else if (resourceKey === "topics") {
        const name = (values as TaxonomySlugStatusValues).name;
        const payload = {
          name,
          status: values.status as TaxonomyStatus,
          image_file_id:
            (values as TaxonomyTopicValues).image_file_id || undefined,
          child_topics: toTaxonomyTreeWritePayload(tree),
        };
        if (mode === "create") {
          await createTaxonomyService("topics", payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService("topics", initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      } else if (resourceKey === "skills") {
        const name = (values as TaxonomySlugStatusValues).name;
        const payload = {
          name,
          status: values.status as TaxonomyStatus,
          children: toTaxonomyTreeWritePayload(tree),
        };
        if (mode === "create") {
          await createTaxonomyService("skills", payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService("skills", initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      } else {
        const name = (values as TaxonomySlugStatusValues).name;
        const payload = {
          name,
          status: values.status as TaxonomyStatus,
        };
        if (mode === "create") {
          await createTaxonomyService(resourceKey, payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService(resourceKey, initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const derivedSlug = slugifyName(nameValue);
  const imagePreviewURL = imagePreview?.url || initialImageFileURL;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="scrollbar-app max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {resourceKey === "outcomes" ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="short_description">
                {tForm("shortDescription")}
              </RequiredLabel>
              <Input
                id="short_description"
                {...form.register("short_description")}
              />
              <FieldError
                error={
                  "short_description" in form.formState.errors
                    ? form.formState.errors.short_description
                    : undefined
                }
                message={resolveValidationMessage(
                  tForm as (key: string) => string,
                  "short_description" in form.formState.errors
                    ? form.formState.errors.short_description?.message
                    : undefined,
                )}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <RequiredLabel htmlFor="name">{tForm("name")}</RequiredLabel>
                <Input id="name" {...form.register("name")} />
                <FieldError
                  error={
                    "name" in form.formState.errors
                      ? form.formState.errors.name
                      : undefined
                  }
                  message={resolveValidationMessage(
                    tForm as (key: string) => string,
                    "name" in form.formState.errors
                      ? form.formState.errors.name?.message
                      : undefined,
                  )}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="slug" required={false}>
                  {tForm("slug")}
                </RequiredLabel>
                <Input
                  id="slug"
                  readOnly
                  value={derivedSlug}
                  className="cursor-not-allowed bg-muted"
                  aria-readonly
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <RequiredLabel required={false}>{tForm("status")}</RequiredLabel>
            <Select
              value={statusValue}
              onValueChange={(value) =>
                form.setValue("status", value as TaxonomyStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  {t("common.statusActive")}
                </SelectItem>
                <SelectItem value="INACTIVE">
                  {t("common.statusInactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.supportsImage ? (
            <ImageFileField
              label={tForm("imageFileId")}
              hint={tForm("imageFileIdHint")}
              browseLabel={tMedia("browse")}
              clearLabel={tMedia("clear")}
              previewAlt={tMedia("previewAlt")}
              noImageSelectedLabel={tMedia("noImageSelected")}
              imageFileId={imageFileId}
              previewUrl={imagePreviewURL}
              browsePermissions={[PERMISSIONS.MediaFileRead]}
              onBrowse={() => setMediaOpen(true)}
              onClear={() => {
                (
                  form.setValue as (
                    name: "image_file_id",
                    value: string,
                  ) => void
                )("image_file_id", "");
                setImagePreview(null);
                setInitialImageFileURL("");
              }}
              hiddenInput={
                <input type="hidden" {...form.register("image_file_id")} />
              }
            />
          ) : null}

          {config.hasTree ? (
            <TaxonomyTreeEditor
              key={`${mode}-${initialData?.id ?? "new"}-${open}`}
              resourceKey={config.key}
              value={tree}
              onChange={setTree}
            />
          ) : null}

          {config.hasDescriptionList ? (
            <TaxonomyDescriptionEditor
              key={`${mode}-${initialData?.id ?? "new"}-${open}`}
              value={description}
              onChange={setDescription}
            />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <MediaCollectionDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        visibleTabs={["image"]}
        defaultTab="image"
        selectionMode="single"
        selectedFileId={imageFileId}
        onSelect={(file, type) => {
          if (type !== "image") {
            toast.error(tMedia("selectImageOnly"));
            return;
          }
          if (!file.id) {
            toast.error(tMedia("selectImageOnly"));
            return;
          }
          (form.setValue as (name: "image_file_id", value: string) => void)(
            "image_file_id",
            file.id,
          );
          setImagePreview(file);
          setInitialImageFileURL("");
        }}
      />
    </Dialog>
  );
}
