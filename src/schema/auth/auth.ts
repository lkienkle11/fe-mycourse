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
    .string({ message: "validation.password" })
    .min(6, { message: "validation.password" }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
