import type { ZodIssue } from "zod";
import type { InstructorApplicationSubmitValues } from "@/schema/instructor";
import { instructorApplicationSubmitSchema } from "@/schema/instructor";
import type { FormState } from "./form-state";
import { toSubmitPayload } from "./form-state";

export type ApplicationFormFieldKey = string;

export type ApplicationFormErrors = Partial<
  Record<ApplicationFormFieldKey, string>
>;

/** Scroll / highlight order when multiple fields fail. */
export const APPLICATION_FORM_FIELD_ORDER: ApplicationFormFieldKey[] = [
  "current_job_title",
  "current_company",
  "cv_file_id",
  "linkedin_url",
  "github_url",
  "portfolio_links",
  "topic_ids",
  "skill_ids",
];

function issuePathToFieldKey(
  path: PropertyKey[],
): ApplicationFormFieldKey | null {
  if (path.length === 0) return null;
  const head = String(path[0]);
  if (head === "current_job_title_id") return "current_job_title";
  if (head === "certificates" && typeof path[1] === "number") {
    return `certificates.${path[1]}`;
  }
  return head;
}

export function mapZodIssuesToFieldErrors(
  issues: ZodIssue[],
): ApplicationFormErrors {
  const errors: ApplicationFormErrors = {};
  for (const issue of issues) {
    const key = issuePathToFieldKey(issue.path);
    if (!key || errors[key]) continue;
    const message = issue.message;
    if (typeof message === "string" && message.length > 0) {
      errors[key] = message;
    }
  }
  return errors;
}

export function validateApplicationForm(form: FormState):
  | {
      ok: true;
      data: InstructorApplicationSubmitValues;
      errors: ApplicationFormErrors;
    }
  | { ok: false; data?: undefined; errors: ApplicationFormErrors } {
  const parsed = instructorApplicationSubmitSchema.safeParse(
    toSubmitPayload(form),
  );
  if (parsed.success) {
    return { ok: true, data: parsed.data, errors: {} };
  }
  return { ok: false, errors: mapZodIssuesToFieldErrors(parsed.error.issues) };
}

export function firstApplicationFormErrorKey(
  errors: ApplicationFormErrors,
): ApplicationFormFieldKey | null {
  for (const key of APPLICATION_FORM_FIELD_ORDER) {
    if (errors[key]) return key;
  }
  const certKey = Object.keys(errors).find((key) =>
    key.startsWith("certificates."),
  );
  return certKey ?? Object.keys(errors)[0] ?? null;
}
