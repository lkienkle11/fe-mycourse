"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { MediaCollectionDialog } from "@/components/features/media";
import { FormField } from "@/components/shared/form-field";
import { ImageFileField } from "@/components/shared/image-file-field";
import { RequiredLabel } from "@/components/shared/required-label";
import { SlugConflictConfirmDialog } from "@/components/shared/slug-conflict-confirm-dialog";
import { SlugField } from "@/components/shared/slug-field";
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
import {
  TAXONOMY_NAME_MAX_LENGTH,
  TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH,
} from "@/constants/taxonomy/limits";
import { useSlugConflictFlow } from "@/hooks/slug";
import {
  buildNameTranslations,
  buildOutcomeTranslations,
  buildTaxonomyFormDefaultValues,
  buildTaxonomyInitialImageFileURL,
  buildTaxonomySlugBaseline,
  collectTabLocales,
  contentLocaleOptionLabel,
  getTaxonomyResourceConfig,
  getTaxonomyTreeFromEntity,
  resolveAllowedContentLocale,
  TAXONOMY_DIALOG_BASE_MIN_PX,
  TAXONOMY_TREE_INDENT_PX,
  uniqueLocales,
  validateTaxonomyTreeSlugs,
} from "@/lib/utils/taxonomy";
import {
  buildTaxonomySubmitPayload,
  getTaxonomySaveSlugNotice,
  persistTaxonomyForm,
} from "@/lib/utils/taxonomy/form-submit";
import { getTreeMaxDepth } from "@/lib/utils/tree";
import { resolveValidationMessage } from "@/lib/utils/validation-message";
import { getTaxonomyFormSchema } from "@/schema/taxonomy";
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
  const config = getTaxonomyResourceConfig(resourceKey);
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
  const [slugBaseline] = useState(() =>
    buildTaxonomySlugBaseline(resourceKey, initialData),
  );
  const [treeSlugErrors, setTreeSlugErrors] = useState<Record<string, string>>(
    {},
  );

  const schema = useMemo(
    () => getTaxonomyFormSchema(resourceKey, mode),
    [resourceKey, mode],
  );

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

  const slugValue =
    (useWatch({
      control: form.control,
      name: "slug" as FieldPath<FormValues>,
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

  const slugFlow = useSlugConflictFlow({
    slug: slugValue,
    setSlug: (next) =>
      (form.setValue as (name: "slug", value: string) => void)("slug", next),
    prepare: (nextSlug) => {
      const issues = validateTaxonomyTreeSlugs(tree, slugBaseline.treeSlugs);
      setTreeSlugErrors(issues);
      if (Object.keys(issues).length > 0) {
        toast.error(tForm("validation.treeSlug"));
        return null;
      }
      const built = buildTaxonomySubmitPayload({
        resourceKey,
        values: { ...form.getValues(), slug: nextSlug },
        nameTranslations,
        outcomeTranslations,
        tree,
        baseline: slugBaseline,
      });
      if (!built.ok) {
        toast.error(
          tForm("outcomeShortRequired", {
            locale: contentLocaleOptionLabel(built.error.locale),
          }),
        );
        return null;
      }
      return built.payload;
    },
    request: async (payload) => ({
      payload,
      saved: await persistTaxonomyForm(
        resourceKey,
        mode,
        initialData?.id,
        expectedRowVersion,
        payload,
      ),
    }),
    onSuccess: ({ payload, saved }) => {
      const notice = getTaxonomySaveSlugNotice(resourceKey, payload, saved);
      if (notice.adjustedSlug) {
        toast.info(tForm("slugAdjusted", { slug: notice.adjustedSlug }));
      }
      if (notice.treeAdjusted) {
        toast.info(tForm("treeSlugsAdjusted"));
      }
      if (!notice.adjustedSlug && !notice.treeAdjusted) {
        toast.success(
          mode === "create"
            ? t("common.createSuccess")
            : t("common.updateSuccess"),
        );
      }
      onSuccess();
      onOpenChange(false);
    },
  });

  const imagePreviewURL = imagePreview?.url || initialImageFileURL;

  const treeMaxDepth = useMemo(
    () => (config.hasTree ? getTreeMaxDepth(tree) : 0),
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

  const resolvedTreeSlugErrors = Object.fromEntries(
    Object.entries(treeSlugErrors).map(([nodeId, key]) => [
      nodeId,
      resolveValidationMessage(tForm, key),
    ]),
  );

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
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(() => void slugFlow.submit())}
        >
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
            <FormField
              id="short_description"
              label={tForm("shortDescription")}
              error={
                activeLocale === "en" &&
                "short_description" in form.formState.errors
                  ? form.formState.errors.short_description
                  : undefined
              }
              errorMessage={resolveValidationMessage(
                tForm,
                "short_description" in form.formState.errors
                  ? form.formState.errors.short_description?.message
                  : undefined,
              )}
            >
              <Input
                id="short_description"
                value={activeOutcome.short_description}
                maxLength={TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH}
                onChange={(event) =>
                  updateActiveOutcomeShort(event.target.value)
                }
              />
            </FormField>
          ) : (
            <>
              <FormField
                id="name"
                label={tForm("name")}
                error={
                  activeLocale === "en" && "name" in form.formState.errors
                    ? form.formState.errors.name
                    : undefined
                }
                errorMessage={resolveValidationMessage(
                  tForm,
                  "name" in form.formState.errors
                    ? form.formState.errors.name?.message
                    : undefined,
                )}
              >
                <Input
                  id="name"
                  value={activeName}
                  maxLength={TAXONOMY_NAME_MAX_LENGTH}
                  onChange={(event) => updateActiveName(event.target.value)}
                />
              </FormField>
              <SlugField
                id="slug"
                required={mode === "edit"}
                label={tForm("slug")}
                placeholder={tForm("slugPlaceholder")}
                hint={tForm(
                  mode === "create" ? "slugHintCreate" : "slugHintEdit",
                )}
                value={slugValue}
                onValueChange={(next) =>
                  form.setValue(
                    "slug" as FieldPath<FormValues>,
                    next as never,
                    { shouldValidate: form.formState.isSubmitted },
                  )
                }
                error={
                  "slug" in form.formState.errors
                    ? form.formState.errors.slug
                    : undefined
                }
                errorMessage={resolveValidationMessage(
                  tForm,
                  "slug" in form.formState.errors
                    ? form.formState.errors.slug?.message
                    : undefined,
                )}
              />
            </>
          )}

          {config.hasTree ? (
            <TaxonomyTreeEditor
              resourceKey={config.key}
              value={tree}
              onChange={(next) => {
                setTree(next);
                setTreeSlugErrors({});
              }}
              editLocale={activeLocale}
              slugErrors={resolvedTreeSlugErrors}
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
              disabled={slugFlow.isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={slugFlow.isSubmitting}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>

        <SlugConflictConfirmDialog
          suggestedSlug={slugFlow.suggestedSlug}
          isSubmitting={slugFlow.isSubmitting}
          onAccept={slugFlow.acceptSuggestion}
          onDismiss={slugFlow.dismissSuggestion}
          labels={{
            title: tForm("slugConflictTitle"),
            description: tForm("slugConflictDescription", {
              slug: slugFlow.suggestedSlug ?? "",
            }),
            confirm: tForm("slugConflictConfirm"),
            cancel: tForm("slugConflictCancel"),
            loading: tForm("slugConflictLoading"),
          }}
        />
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
