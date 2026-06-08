import { z } from "zod";

/** Client-side upload batch — mirrors validateMediaUploadBatch rules. */
export const mediaUploadBatchSchema = z.object({
  fileCount: z.number().max(5, { message: "validation.tooMany" }),
  maxFileBytes: z.number(),
  totalBytes: z.number(),
});

export type MediaUploadBatchValues = z.infer<typeof mediaUploadBatchSchema>;
