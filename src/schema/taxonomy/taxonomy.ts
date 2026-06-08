import { z } from "zod";

const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const taxonomySlugStatusSchema = z.object({
  name: z
    .string({ message: "validation.name" })
    .min(1, { message: "validation.name" }),
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
    .max(100, { message: "validation.shortDescriptionMax" }),
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
