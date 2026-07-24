import { deriveCustomJobTitleId } from "@/lib/instructor-application/combobox";
import { INSTRUCTOR_PAGE_STATE } from "@/lib/instructor-application/page-state";
import type {
  InstructorCertificate,
  MyInstructorApplication,
  SubmitInstructorApplicationPayload,
  YearsExperienceCode,
} from "@/types/instructor";

export type FormState = {
  bio: string;
  teaching_content_ideas: string;
  years_of_experience: YearsExperienceCode;
  current_job_title: string;
  current_job_title_id: string;
  current_company: string;
  current_company_id: string;
  current_company_domain: string;
  current_company_description: string;
  current_company_location: string;
  cv_file_id: string;
  cv_file_name: string;
  linkedin_url: string;
  github_url: string;
  portfolio_links: string[];
  certificates: InstructorCertificate[];
  intro_video_file_id: string;
  intro_video_name: string;
  topic_ids: string[];
  skill_ids: string[];
};

/** Clears company snapshot metadata when the user types free text (no suggestion pick). */
export function applyCompanyFreeText(
  prev: FormState,
  companyName: string,
): FormState {
  return {
    ...prev,
    current_company: companyName,
    current_company_id: "",
    current_company_domain: "",
    current_company_description: "",
    current_company_location: "",
  };
}

export const EMPTY_FORM: FormState = {
  bio: "",
  teaching_content_ideas: "",
  years_of_experience: "UNDER_1_YEAR",
  current_job_title: "",
  current_job_title_id: "",
  current_company: "",
  current_company_id: "",
  current_company_domain: "",
  current_company_description: "",
  current_company_location: "",
  cv_file_id: "",
  cv_file_name: "",
  linkedin_url: "",
  github_url: "",
  portfolio_links: [""],
  certificates: [],
  intro_video_file_id: "",
  intro_video_name: "",
  topic_ids: [],
  skill_ids: [],
};

export function formFromApplication(
  application: MyInstructorApplication,
): FormState {
  const profile = application.latest_submission?.profile;
  if (!profile) return { ...EMPTY_FORM };
  return {
    bio: profile.bio ?? "",
    teaching_content_ideas: profile.teaching_content_ideas ?? "",
    years_of_experience:
      (profile.years_of_experience as YearsExperienceCode) || "UNDER_1_YEAR",
    current_job_title: profile.current_job_title ?? "",
    current_job_title_id: profile.current_job_title_id ?? "",
    current_company: profile.current_company ?? "",
    current_company_id: profile.current_company_id ?? "",
    current_company_domain: profile.current_company_domain ?? "",
    current_company_description: profile.current_company_description ?? "",
    current_company_location: profile.current_company_location ?? "",
    cv_file_id: profile.cv_file_id ?? "",
    cv_file_name: profile.cv_file?.filename ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    github_url: profile.github_url ?? "",
    portfolio_links: profile.portfolio_links?.length
      ? profile.portfolio_links
      : [""],
    certificates: (profile.certificates ?? []).map((cert) => ({
      title: cert.title ?? "",
      issuer: cert.issuer ?? "",
      issued_year: cert.issued_year ?? new Date().getFullYear(),
      credential_url: cert.credential_url ?? "",
      certificate_file_id: cert.certificate_file_id ?? "",
      certificate_file: cert.certificate_file ?? null,
      _local_id: crypto.randomUUID(),
    })),
    intro_video_file_id: profile.intro_video_file_id ?? "",
    intro_video_name: profile.intro_video_file?.filename ?? "",
    topic_ids: application.latest_submission?.topic_ids ?? [],
    skill_ids: application.latest_submission?.skill_ids ?? [],
  };
}

export function toSubmitPayload(
  form: FormState,
): SubmitInstructorApplicationPayload {
  return {
    headline: "",
    bio: form.bio.trim(),
    teaching_content_ideas: form.teaching_content_ideas.trim(),
    years_of_experience: form.years_of_experience,
    current_job_title: form.current_job_title.trim(),
    current_job_title_id:
      form.current_job_title_id.trim() ||
      deriveCustomJobTitleId(form.current_job_title),
    current_company: form.current_company.trim(),
    current_company_id: form.current_company_id.trim() || null,
    current_company_domain: form.current_company_domain.trim() || null,
    current_company_description:
      form.current_company_description.trim() || null,
    current_company_location: form.current_company_location.trim() || null,
    cv_file_id: form.cv_file_id,
    linkedin_url: form.linkedin_url.trim(),
    github_url: form.github_url.trim(),
    portfolio_links: form.portfolio_links
      .map((link) => link.trim())
      .filter(Boolean),
    certificates: form.certificates
      .filter((cert) => cert.title.trim())
      .map((cert) => ({
        title: cert.title.trim(),
        issuer: cert.issuer.trim(),
        issued_year: cert.issued_year,
        credential_url: cert.credential_url?.trim() ?? "",
        certificate_file_id: cert.certificate_file_id?.trim() ?? "",
      })),
    intro_video_file_id: form.intro_video_file_id,
    topic_ids: form.topic_ids,
    skill_ids: form.skill_ids,
  };
}

export function resolveInitialForm(
  application: MyInstructorApplication | null | undefined,
  pageState: string,
): FormState {
  if (application && pageState !== INSTRUCTOR_PAGE_STATE.ready_to_apply) {
    return formFromApplication(application);
  }
  return { ...EMPTY_FORM };
}
