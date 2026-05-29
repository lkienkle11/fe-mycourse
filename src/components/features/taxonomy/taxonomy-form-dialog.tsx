"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  createTaxonomyService,
  updateTaxonomyService,
} from "@/api/callers/taxonomy";
import { MediaCollectionDialog } from "@/components/features/media";
import { ImageFileField } from "@/components/shared/image-file-field";
import { Button } from "@/components/ui/button";
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
import { PERMISSIONS } from "@/constants/permissions";
import { slugifyName } from "@/lib/utils";
import {
  getTaxonomyResourceConfig,
  getTaxonomyTreeFromEntity,
} from "@/lib/utils/taxonomy";
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

const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const slugStatusSchema = z.object({
  name: z.string().min(1),
  status: statusSchema,
});

const topicSchema = slugStatusSchema.extend({
  image_file_id: z.string().optional(),
  child_topics: z.array(z.any()).optional(),
});

const skillSchema = slugStatusSchema.extend({
  children: z.array(z.any()).optional(),
});

const outcomeSchema = z.object({
  short_description: z.string().min(1).max(100),
  description: z.array(z.string().max(120)).max(8).optional(),
  image_file_id: z.string().optional(),
  status: statusSchema,
});

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
  const config = getTaxonomyResourceConfig(resourceKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tree, setTree] = useState<TaxonomyTreeNode[]>([]);
  const [description, setDescription] = useState<string[]>([]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<MediaFile | null>(null);
  const [initialImageFileURL, setInitialImageFileURL] = useState("");

  const schema = useMemo(() => {
    if (resourceKey === "outcomes") return outcomeSchema;
    if (resourceKey === "topics") return topicSchema;
    if (resourceKey === "skills") return skillSchema;
    return slugStatusSchema;
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

  useEffect(() => {
    if (!open) return;

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
  }, [open, initialData, resourceKey, form]);

  const imageFileId = form.watch("image_file_id" as keyof FormValues) as
    | string
    | undefined;

  const normalizeTreeSlugs = (nodes: TaxonomyTreeNode[]): TaxonomyTreeNode[] =>
    nodes.map((node) => ({
      ...node,
      slug: slugifyName(node.name),
      children: node.children?.length
        ? normalizeTreeSlugs(node.children)
        : undefined,
    }));

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
          short_description: (values as z.infer<typeof outcomeSchema>)
            .short_description,
          description: description.filter((line) => line.trim().length > 0),
          image_file_id:
            (values as z.infer<typeof outcomeSchema>).image_file_id ||
            undefined,
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
        const name = (values as z.infer<typeof slugStatusSchema>).name;
        const payload = {
          name,
          slug: slugifyName(name),
          status: values.status as TaxonomyStatus,
          image_file_id:
            (values as z.infer<typeof topicSchema>).image_file_id || undefined,
          child_topics: normalizeTreeSlugs(tree),
        };
        if (mode === "create") {
          await createTaxonomyService("topics", payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService("topics", initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      } else if (resourceKey === "skills") {
        const name = (values as z.infer<typeof slugStatusSchema>).name;
        const payload = {
          name,
          slug: slugifyName(name),
          status: values.status as TaxonomyStatus,
          children: normalizeTreeSlugs(tree),
        };
        if (mode === "create") {
          await createTaxonomyService("skills", payload);
          toast.success(t("common.createSuccess"));
        } else if (initialData) {
          await updateTaxonomyService("skills", initialData.id, payload);
          toast.success(t("common.updateSuccess"));
        }
      } else {
        const name = (values as z.infer<typeof slugStatusSchema>).name;
        const payload = {
          name,
          slug: slugifyName(name),
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
    } catch {
      toast.error(t("common.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameValue = (form.watch("name" as keyof FormValues) as string) ?? "";
  const derivedSlug = slugifyName(nameValue);
  const imagePreviewURL = imagePreview?.url || initialImageFileURL;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-app max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {resourceKey === "outcomes" ? (
            <div className="space-y-2">
              <Label htmlFor="short_description">
                {tForm("shortDescription")}
              </Label>
              <Input
                id="short_description"
                {...form.register("short_description")}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">{tForm("name")}</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{tForm("slug")}</Label>
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
            <Label>{tForm("status")}</Label>
            <Select
              value={form.watch("status") as TaxonomyStatus}
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
            toast.error(t("common.errorGeneric"));
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
