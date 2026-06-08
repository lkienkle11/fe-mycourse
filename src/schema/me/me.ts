import { z } from "zod";

/** PATCH /api/v1/me — optional avatar_file_id (valid UUID when provided). */
export const updateMeSchema = z.object({
  avatar_file_id: z
    .string({ message: "validation.avatarFileId" })
    .uuid({ message: "validation.avatarFileId" })
    .optional()
    .or(z.literal("")),
});

export type UpdateMeFormValues = z.infer<typeof updateMeSchema>;
