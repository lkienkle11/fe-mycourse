"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { toastApiError } from "@/lib/utils/api-error";
import {
  buildNameTranslations,
  buildOutcomeTranslations,
  buildTaxonomyFormDefaultValues,
  buildTaxonomyInitialImageFileURL,
  collectTabLocales,
  contentLocaleOptionLabel,
  getPersistedTaxonomySlug,
  getTaxonomyResourceConfig,
  getTaxonomyTreeFromEntity,
  getTaxonomyTreeMaxDepth,
  resolveAllowedContentLocale,
  resolveTaxonomySlugPreview,
  TAXONOMY_DIALOG_BASE_MIN_PX,
  TAXONOMY_TREE_INDENT_PX,
  uniqueLocales,
} from "@/lib/utils/taxonomy";
import {
  buildTaxonomySubmitPayload,
  persistTaxonomyForm,
} from "@/lib/utils/taxonomy/form-submit";
import { resolveValidationMessage } from "@/lib/utils/validation-message";
import {
  taxonomyOutcomeSchema,
  taxonomySkillSchema,
  taxonomySlugStatusSchema,
  taxonomyTopicSchema,
} from "@/schema/taxonomy";
import type { MediaFile } from "@/types/media";
import type {
  TaxonomyEntity,
  TaxonomyResourceKey,
  TaxonomyStatus,
  TaxonomyTreeNode,
} from "@/types/taxonomy";
import { TaxonomyDescriptionEditor } from "./taxonomy-description-editor";
import { TaxonomyLocaleTabsSection } from "./taxonomy-locale-tabs-section";
import { TaxonomyTreeEditor } from "./taxonomy-tree-editor";

export type TaxonomyFormDialogProps = {
  resourceKey: TaxonomyResourceKey;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Create: null. Edit: editable detail from `getTaxonomyDetailService(..., { view: "edit" })`. */
  initialData?: TaxonomyEntity | null;
  onSuccess: () => void;
};

export { buildTaxonomyFormDefaultValues } from "@/lib/utils/taxonomy";

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
  const [tree, setTree] = useState<TaxonomyTreeNode[]>(() =>
    getTaxonomyTreeFromEntity(resourceKey, initialData),
  );
  const [nameTranslations, setNameTranslations] = useState(() =>
    buildNameTranslations(initialData),
  );
  const [outcomeTranslations, setOutcomeTranslations] = useState(() =>
    buildOutcomeTranslations(initialData),
  );
  const [extraLocales, setExtraLocales] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState("en");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<MediaFile | null>(null);
  const [initialImageFileURL, setInitialImageFileURL] = useState(() =>
    buildTaxonomyInitialImageFileURL(resourceKey, initialData),
  );
  const [persistedSlug] = useState(() =>
    getPersistedTaxonomySlug(resourceKey, initialData),
  );

  const schema = useMemo(() => {
    if (resourceKey === "outcomes") return taxonomyOutcomeSchema;
    if (resourceKey === "topics") return taxonomyTopicSchema;
    if (resourceKey === "skills") return taxonomySkillSchema;
    return taxonomySlugStatusSchema;
  }, [resourceKey]);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildTaxonomyFormDefaultValues(
      resourceKey,
      initialData,
    ) as FormValues,
  });

  const imageFileId = useWatch({
    control: form.control,
    name: "image_file_id" as FieldPath<FormValues>,
  }) as string | undefined;

  const nameValue =
    (useWatch({
      control: form.control,
      name: "name" as FieldPath<FormValues>,
    }) as string | undefined) ?? "";

  const statusValue =
    (useWatch({
      control: form.control,
      name: "status",
    }) as TaxonomyStatus | undefined) ?? "ACTIVE";

  const tabLocales = useMemo(
    () =>
      collectTabLocales(
        resourceKey === "outcomes"
          ? Object.keys(outcomeTranslations)
          : Object.keys(nameTranslations),
        initialData?.available_locales,
        extraLocales,
      ),
    [
      extraLocales,
      initialData?.available_locales,
      nameTranslations,
      outcomeTranslations,
      resourceKey,
    ],
  );

  const resourceLabel = t(`resources.${resourceKey}.singular`);
  const dialogTitle =
    mode === "create"
      ? tForm("createTitle", { resource: resourceLabel })
      : tForm("editTitle", { resource: resourceLabel });

  const expectedRowVersion = initialData?.row_version ?? 0;

  const addLocaleTab = (rawLocale: string) => {
    const locale = resolveAllowedContentLocale(rawLocale);
    if (!locale) {
      toast.error(tForm("invalidLocale"));
      return;
    }
    if (tabLocales.includes(locale)) {
      setActiveLocale(locale);
      return;
    }
    setExtraLocales((prev) => uniqueLocales([...prev, locale]));
    if (resourceKey === "outcomes") {
      setOutcomeTranslations((prev) =>
        prev[locale]
          ? prev
          : {
              ...prev,
              [locale]: { short_description: "", description: [""] },
            },
      );
    } else {
      setNameTranslations((prev) =>
        prev[locale] ? prev : { ...prev, [locale]: { name: "" } },
      );
    }
    setActiveLocale(locale);
  };

  const updateActiveName = (value: string) => {
    setNameTranslations((prev) => ({
      ...prev,
      [activeLocale]: { name: value },
    }));
    if (activeLocale === "en") {
      (form.setValue as (name: "name", value: string) => void)("name", value);
    }
  };

  const updateActiveOutcomeShort = (value: string) => {
    setOutcomeTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        short_description: value,
        description: prev[activeLocale]?.description ?? [""],
      },
    }));
    if (activeLocale === "en") {
      (form.setValue as (name: "short_description", value: string) => void)(
        "short_description",
        value,
      );
    }
  };

  const updateActiveOutcomeDescription = (value: string[]) => {
    setOutcomeTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        short_description: prev[activeLocale]?.short_description ?? "",
        description: value,
      },
    }));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const built = buildTaxonomySubmitPayload({
        resourceKey,
        values,
        nameTranslations,
        outcomeTranslations,
        tree,
      });
      if (!built.ok) {
        toast.error(
          tForm("outcomeShortRequired", {
            locale: contentLocaleOptionLabel(built.error.locale),
          }),
        );
        return;
      }
      await persistTaxonomyForm(
        resourceKey,
        mode,
        initialData?.id,
        expectedRowVersion,
        built.payload,
      );
      toast.success(
        mode === "create"
          ? t("common.createSuccess")
          : t("common.updateSuccess"),
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slugPreview = useMemo(
    () => resolveTaxonomySlugPreview(nameValue, persistedSlug),
    [nameValue, persistedSlug],
  );
  const imagePreviewURL = imagePreview?.url || initialImageFileURL;

  const treeMaxDepth = useMemo(
    () => (config.hasTree ? getTaxonomyTreeMaxDepth(tree) : 0),
    [config.hasTree, tree],
  );

  const dialogMinWidth =
    config.hasTree && treeMaxDepth > 0
      ? `min(100%, ${TAXONOMY_DIALOG_BASE_MIN_PX + treeMaxDepth * TAXONOMY_TREE_INDENT_PX}px)`
      : undefined;

  const activeName = nameTranslations[activeLocale]?.name ?? "";
  const activeOutcome = outcomeTranslations[activeLocale] ?? {
    short_description: "",
    description: [""],
  };
  const hasActiveTranslation =
    resourceKey === "outcomes"
      ? Boolean(activeOutcome.short_description.trim()) ||
        (activeOutcome.description ?? []).some((line) => line.trim())
      : Boolean(activeName.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="scrollbar-app max-h-[90vh] w-full max-w-[calc(100%-2rem)] overflow-x-auto overflow-y-auto sm:w-max sm:min-w-2xl sm:max-w-[calc(100%-2rem)]"
        style={dialogMinWidth ? { minWidth: dialogMinWidth } : undefined}
        showCloseButton={false}
      >
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2 flex items-start justify-between gap-2 bg-popover px-4 pt-4 pb-2">
          <DialogHeader className="min-w-0 flex-1 gap-2">
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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

          <TaxonomyLocaleTabsSection
            activeLocale={activeLocale}
            tabLocales={tabLocales}
            onActiveLocaleChange={setActiveLocale}
            onAddLocale={addLocaleTab}
          />

          {!hasActiveTranslation && activeLocale !== "en" ? (
            <p className="text-sm text-muted-foreground">
              {tForm("missingTranslation")}
            </p>
          ) : null}

          {resourceKey === "outcomes" ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="short_description">
                {tForm("shortDescription")}
              </RequiredLabel>
              <Input
                id="short_description"
                value={activeOutcome.short_description}
                maxLength={100}
                onChange={(event) =>
                  updateActiveOutcomeShort(event.target.value)
                }
              />
              {activeLocale === "en" ? (
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
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <RequiredLabel htmlFor="name">{tForm("name")}</RequiredLabel>
                <Input
                  id="name"
                  value={activeName}
                  maxLength={255}
                  onChange={(event) => updateActiveName(event.target.value)}
                />
                {activeLocale === "en" ? (
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
                ) : null}
              </div>
              {activeLocale === "en" ? (
                <div className="space-y-2">
                  <RequiredLabel htmlFor="slug" required={false}>
                    {tForm("slug")}
                  </RequiredLabel>
                  <Input
                    id="slug"
                    readOnly
                    value={slugPreview}
                    className="cursor-not-allowed bg-muted"
                    aria-readonly
                  />
                </div>
              ) : null}
            </>
          )}

          {config.hasTree ? (
            <TaxonomyTreeEditor
              resourceKey={config.key}
              value={tree}
              onChange={setTree}
              editLocale={activeLocale}
            />
          ) : null}

          {config.hasDescriptionList ? (
            <TaxonomyDescriptionEditor
              value={activeOutcome.description ?? [""]}
              onChange={updateActiveOutcomeDescription}
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
