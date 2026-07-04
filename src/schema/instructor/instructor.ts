import { z } from "zod";
import {
  optionalCredentialUrlSchema,
  optionalGitHubUrlSchema,
  optionalLinkedInUrlSchema,
  portfolioLinkItemSchema,
} from "@/lib/instructor-application/url-validation";

const yearsExperienceCodeSchema = z.enum([
  "UNDER_1_YEAR",
  "ONE_TO_TWO_YEARS",
  "THREE_TO_FIVE_YEARS",
  "SIX_TO_TEN_YEARS",
  "OVER_TEN_YEARS",
]);

const instructorCertificateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    issuer: z.string().trim().min(1).max(80),
    issued_year: z.number().int().min(1950).max(2100),
    credential_url: optionalCredentialUrlSchema.optional(),
    certificate_file_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  })
  .refine(
    (cert) =>
      Boolean(cert.credential_url?.trim()) ||
      Boolean(cert.certificate_file_id?.trim()),
    { message: "validation.certProof", path: ["certificate_file_id"] },
  );

export const instructorApplicationSubmitSchema = z.object({
  headline: z.string().trim().max(100).optional().default(""),
  bio: z
    .string({ message: "validation.bio" })
    .trim()
    .min(100, { message: "validation.bioMin" })
    .max(2000, { message: "validation.bioMax" }),
  years_of_experience: yearsExperienceCodeSchema,
  current_job_title: z
    .string({ message: "validation.currentJobTitle" })
    .trim()
    .min(1, { message: "validation.currentJobTitle" }),
  current_job_title_id: z
    .string({ message: "validation.currentJobTitleId" })
    .trim()
    .min(1, { message: "validation.currentJobTitleId" }),
  current_company: z
    .string({ message: "validation.currentCompany" })
    .trim()
    .min(1, { message: "validation.currentCompany" }),
  current_company_id: z.string().trim().optional().nullable(),
  current_company_domain: z.string().trim().optional().nullable(),
  current_company_description: z.string().trim().optional().nullable(),
  current_company_location: z.string().trim().optional().nullable(),
  cv_file_id: z
    .string({ message: "validation.cvFile" })
    .trim()
    .min(1, { message: "validation.cvFile" })
    .uuid({ message: "validation.cvFile" }),
  linkedin_url: optionalLinkedInUrlSchema.optional(),
  github_url: optionalGitHubUrlSchema.optional(),
  portfolio_links: z
    .array(portfolioLinkItemSchema)
    .max(5, { message: "validation.portfolioMax" })
    .optional()
    .default([]),
  certificates: z
    .array(instructorCertificateSchema)
    .max(10, { message: "validation.certificatesMax" })
    .optional()
    .default([]),
  intro_video_file_id: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .default(""),
  topic_ids: z
    .array(z.string().uuid({ message: "validation.topicIds" }))
    .min(1, { message: "validation.topicIdsMin" })
    .max(5, { message: "validation.topicIdsMax" }),
  skill_ids: z
    .array(z.string().uuid({ message: "validation.skillIds" }))
    .min(1, { message: "validation.skillIdsMin" })
    .max(15, { message: "validation.skillIdsMax" }),
});

export const instructorContactAdminSchema = z.object({
  subject: z
    .string({ message: "validation.contactSubject" })
    .trim()
    .min(1, { message: "validation.contactSubject" })
    .max(200, { message: "validation.contactSubjectMax" }),
  message: z
    .string({ message: "validation.contactMessage" })
    .trim()
    .min(1, { message: "validation.contactMessage" })
    .max(2000, { message: "validation.contactMessageMax" }),
});

export const instructorEmailSchema = z.object({
  email: z
    .string({ message: "validation.email" })
    .min(1, { message: "validation.email" })
    .email({ message: "validation.email" }),
});

export const instructorRejectionReasonSchema = z.object({
  reason: z
    .string({ message: "validation.rejectionReason" })
    .min(1, { message: "validation.rejectionReason" })
    .max(2000, { message: "validation.rejectionReasonMax" }),
});

export const instructorExpertiseTopicSchema = z.object({
  topic_id: z
    .string({ message: "validation.topicId" })
    .min(1, { message: "validation.topicId" })
    .uuid({ message: "validation.topicId" }),
});

export const instructorExpertiseSkillSchema = z.object({
  skill_id: z
    .string({ message: "validation.skillId" })
    .min(1, { message: "validation.skillId" })
    .uuid({ message: "validation.skillId" }),
});

export const instructorTicketSchema = z.object({
  subject: z
    .string({ message: "validation.ticketSubject" })
    .min(1, { message: "validation.ticketSubject" }),
  message: z
    .string({ message: "validation.ticketMessage" })
    .min(1, { message: "validation.ticketMessage" }),
});

export type InstructorEmailValues = z.infer<typeof instructorEmailSchema>;
export type InstructorRejectionReasonValues = z.infer<
  typeof instructorRejectionReasonSchema
>;
export type InstructorExpertiseTopicValues = z.infer<
  typeof instructorExpertiseTopicSchema
>;
export type InstructorExpertiseSkillValues = z.infer<
  typeof instructorExpertiseSkillSchema
>;
export type InstructorTicketValues = z.infer<typeof instructorTicketSchema>;
export type InstructorApplicationSubmitValues = z.infer<
  typeof instructorApplicationSubmitSchema
>;
export type InstructorContactAdminValues = z.infer<
  typeof instructorContactAdminSchema
>;
