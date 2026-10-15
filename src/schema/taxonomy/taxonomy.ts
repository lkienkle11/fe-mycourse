import { z } from "zod";
import {
  TAXONOMY_NAME_MAX_LENGTH,
  TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH,
} from "@/constants/taxonomy/limits";
import { optionalSlugField, requiredSlugField } from "@/schema/shared";
import type { TaxonomyResourceKey } from "@/types/taxonomy";

const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const taxonomyNameField = z
  .string({ message: "validation.name" })
  .trim()
  .min(1, { message: "validation.name" })
  .max(TAXONOMY_NAME_MAX_LENGTH, { message: "validation.nameMax" });

export const taxonomySlugStatusSchema = z.object({
  name: taxonomyNameField,
  /** Blank is allowed (the backend generates it); `required` on edit, see `getTaxonomyFormSchema`. */
  slug: optionalSlugField.optional(),
  status: statusSchema,
});

export const taxonomyTopicSchema = taxonomySlugStatusSchema.extend({
  image_file_id: z.string().optional(),
  child_topics: z.array(z.any()).optional(),
});

export const taxonomySkillSchema = taxonomySlugStatusSchema.extend({
  children: z.array(z.any()).optional(),
});

export const taxonomyOutcomeSchema = z.object({
  short_description: z
    .string({ message: "validation.shortDescription" })
    .min(1, { message: "validation.shortDescription" })
    .max(TAXONOMY_SHORT_DESCRIPTION_MAX_LENGTH, {
      message: "validation.shortDescriptionMax",
    }),
  description: z
    .array(z.string().max(120, { message: "validation.descriptionLineMax" }))
    .max(8, { message: "validation.descriptionMaxLines" })
    .optional(),
  image_file_id: z.string().optional(),
  status: statusSchema,
});

export type TaxonomySlugStatusValues = z.infer<typeof taxonomySlugStatusSchema>;
export type TaxonomyTopicValues = z.infer<typeof taxonomyTopicSchema>;
export type TaxonomySkillValues = z.infer<typeof taxonomySkillSchema>;
export type TaxonomyOutcomeValues = z.infer<typeof taxonomyOutcomeSchema>;

/**
 * Schema for the taxonomy form dialog. Edit mode requires a non-blank slug for
 * resources that have one (the backend answers 400 for a blank slug on update).
 */
export function getTaxonomyFormSchema(
  resourceKey: TaxonomyResourceKey,
  mode: "create" | "edit",
) {
  if (resourceKey === "outcomes") return taxonomyOutcomeSchema;
  const schema =
    resourceKey === "topics"
      ? taxonomyTopicSchema
      : resourceKey === "skills"
        ? taxonomySkillSchema
        : taxonomySlugStatusSchema;
  return mode === "edit" ? schema.extend({ slug: requiredSlugField }) : schema;
}
