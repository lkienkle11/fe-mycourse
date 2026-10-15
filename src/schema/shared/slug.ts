import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/utils/slug";

const slugFormatField = (allowEmpty: boolean) =>
  z
    .string()
    .max(SLUG_MAX_LENGTH, { message: "validation.slugMax" })
    .refine(
      (value) => (allowEmpty && value === "") || SLUG_PATTERN.test(value),
      {
        message: "validation.slugInvalid",
      },
    );

/** Blank allowed (the backend generates it); otherwise `SLUG_PATTERN` + max length. */
export const optionalSlugField = slugFormatField(true);

/** Blank is rejected first with `validation.slugRequired`, then format + length. */
export const requiredSlugField = z
  .string()
  .min(1, { message: "validation.slugRequired" })
  .pipe(slugFormatField(false));
