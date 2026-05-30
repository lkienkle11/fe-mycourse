"use client";

import useSWR from "swr";
import {
  getInstructorExpertiseSkillsKey,
  getInstructorExpertiseTopicsKey,
  listInstructorExpertiseSkillsService,
  listInstructorExpertiseTopicsService,
} from "@/api/callers/instructor";
import type {
  InstructorExpertiseSkill,
  InstructorExpertiseTopic,
} from "@/types/instructor";

export function useInstructorExpertiseTopics(instructorId: number | null) {
  const key = instructorId
    ? getInstructorExpertiseTopicsKey(instructorId)
    : null;
  const swr = useSWR<InstructorExpertiseTopic[]>(
    key,
    () => listInstructorExpertiseTopicsService(instructorId as number),
    { revalidateOnFocus: true },
  );
  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}

export function useInstructorExpertiseSkills(instructorId: number | null) {
  const key = instructorId
    ? getInstructorExpertiseSkillsKey(instructorId)
    : null;
  const swr = useSWR<InstructorExpertiseSkill[]>(
    key,
    () => listInstructorExpertiseSkillsService(instructorId as number),
    { revalidateOnFocus: true },
  );
  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
