import { z } from "zod";
import { optionalSlugField } from "@/schema/shared";

/**
 * PATCH /api/v1/me — optional avatar_file_id (valid UUID when provided) and
 * optional slug (shared slug format; blank means "do not send").
 */
export const updateMeSchema = z.object({
  avatar_file_id: z
    .string({ message: "validation.avatarFileId" })
    .uuid({ message: "validation.avatarFileId" })
    .optional()
    .or(z.literal("")),
  slug: optionalSlugField.optional(),
});

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>;
