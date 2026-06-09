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

export function useInstructorExpertiseTopics(instructorId: string | null) {
  return useApiRowsQuery<InstructorExpertiseTopic>(
    instructorId ? getInstructorExpertiseTopicsKey(instructorId) : null,
    () => listInstructorExpertiseTopicsService(instructorId as string),
    { revalidateOnFocus: true },
  );
}

export function useInstructorExpertiseSkills(instructorId: string | null) {
  return useApiRowsQuery<InstructorExpertiseSkill>(
    instructorId ? getInstructorExpertiseSkillsKey(instructorId) : null,
    () => listInstructorExpertiseSkillsService(instructorId as string),
    { revalidateOnFocus: true },
  );
}
