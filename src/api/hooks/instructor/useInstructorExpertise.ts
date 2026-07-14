"use client";

import {
  getInstructorExpertiseSkillsKey,
  getInstructorExpertiseTopicsKey,
  listInstructorExpertiseSkillsService,
  listInstructorExpertiseTopicsService,
} from "@/api/callers/instructor";
import { useApiRowsQuery } from "@/api/hooks/shared";
import type {
  InstructorExpertiseSkill,
  InstructorExpertiseTopic,
} from "@/types/instructor";

export function useInstructorExpertiseTopics(
  instructorId: string | null,
  locale?: string,
) {
  return useApiRowsQuery<InstructorExpertiseTopic>(
    instructorId ? getInstructorExpertiseTopicsKey(instructorId, locale) : null,
    () => listInstructorExpertiseTopicsService(instructorId as string, locale),
    { revalidateOnFocus: true },
  );
}

export function useInstructorExpertiseSkills(
  instructorId: string | null,
  locale?: string,
) {
  return useApiRowsQuery<InstructorExpertiseSkill>(
    instructorId ? getInstructorExpertiseSkillsKey(instructorId, locale) : null,
    () => listInstructorExpertiseSkillsService(instructorId as string, locale),
    { revalidateOnFocus: true },
  );
}
