import { z } from "zod";

/**
 * Schema đăng nhập.
 * Message của mỗi field dùng i18n key → component translate qua useTranslations("auth").
 */
export const loginSchema = z.object({
  email: z
    .string({ message: "validation.email" })
    .min(1, { message: "validation.email" })
    .email({ message: "validation.email" }),
  password: z
    .string({ message: "validation.password" })
    .min(1, { message: "validation.password" }),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Khớp BE isStrongPassword: min 8, upper, lower, special. */
const strongPasswordRefine = (pw: string) => {
  if (pw.length < 8) return false;
  let hasUpper = false;
  let hasLower = false;
  let hasSpecial = false;
  for (const ch of pw) {
    if (/[A-Z]/.test(ch)) hasUpper = true;
    else if (/[a-z]/.test(ch)) hasLower = true;
    else if (!/[a-zA-Z0-9\s]/.test(ch)) hasSpecial = true;
  }
  return hasUpper && hasLower && hasSpecial;
};

/**
 * Schema đăng ký.
 * Message của mỗi field dùng i18n key → component translate qua useTranslations("auth").
 */
export const signupSchema = z.object({
  fullName: z
    .string({ message: "validation.fullName" })
    .min(1, { message: "validation.fullName" }),
  email: z
    .string({ message: "validation.email" })
    .min(1, { message: "validation.email" })
    .email({ message: "validation.email" }),
  password: z
    .string({ message: "validation.passwordWeak" })
    .min(8, { message: "validation.passwordWeak" })
    .refine(strongPasswordRefine, { message: "validation.passwordWeak" }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
