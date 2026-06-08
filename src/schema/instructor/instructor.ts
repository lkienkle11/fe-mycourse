import { z } from "zod";

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
    .min(1, { message: "validation.topicId" }),
});

export const instructorExpertiseSkillSchema = z.object({
  skill_id: z
    .string({ message: "validation.skillId" })
    .min(1, { message: "validation.skillId" }),
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
