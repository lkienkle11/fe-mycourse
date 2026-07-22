/**
 * Instructor expertise callers (isomorphic factory slice).
 */

import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type {
  AddExpertiseSkillPayload,
  AddExpertiseTopicPayload,
  InstructorExpertiseSkill,
  InstructorExpertiseTopic,
} from "@/types/instructor";
import {
  getInstructorExpertiseSkillsKey,
  getInstructorExpertiseTopicsKey,
} from "./instructor-factory-keys";

const routes = API_PRIVATE_ROUTES.instructor;

export function createInstructorExpertiseCallers(methods: ApiMethods) {
  async function listInstructorExpertiseTopicsService(
    instructorId: string,
    locale?: string,
  ): Promise<InstructorExpertiseTopic[]> {
    const { data } = await methods.apiFetch<
      ApiResponse<InstructorExpertiseTopic[]>
    >(getInstructorExpertiseTopicsKey(instructorId, locale));
    if (!data.data) throw new Error(data.message || "Failed to load topics");
    return data.data;
  }

  async function addInstructorExpertiseTopicService(
    instructorId: string,
    payload: AddExpertiseTopicPayload,
  ): Promise<InstructorExpertiseTopic> {
    const url = buildQueryParams(routes.expertiseTopics, undefined, {
      id: String(instructorId),
    });
    if (!url) throw new Error("Invalid add topic URL");
    const { data } = await methods.apiPost<
      ApiResponse<InstructorExpertiseTopic>,
      AddExpertiseTopicPayload
    >(url, payload);
    if (!data.data) throw new Error(data.message || "Failed to add topic");
    return data.data;
  }

  async function deleteInstructorExpertiseTopicService(
    instructorId: string,
    topicRowId: string,
  ): Promise<void> {
    const url = buildQueryParams(routes.expertiseTopicByRow, undefined, {
      id: String(instructorId),
      topicRowId: String(topicRowId),
    });
    if (!url) throw new Error("Invalid delete topic URL");
    await methods.apiDelete<ApiResponse<null>>(url);
  }

  async function listInstructorExpertiseSkillsService(
    instructorId: string,
    locale?: string,
  ): Promise<InstructorExpertiseSkill[]> {
    const { data } = await methods.apiFetch<
      ApiResponse<InstructorExpertiseSkill[]>
    >(getInstructorExpertiseSkillsKey(instructorId, locale));
    if (!data.data) throw new Error(data.message || "Failed to load skills");
    return data.data;
  }

  async function addInstructorExpertiseSkillService(
    instructorId: string,
    payload: AddExpertiseSkillPayload,
  ): Promise<InstructorExpertiseSkill> {
    const url = buildQueryParams(routes.expertiseSkills, undefined, {
      id: String(instructorId),
    });
    if (!url) throw new Error("Invalid add skill URL");
    const { data } = await methods.apiPost<
      ApiResponse<InstructorExpertiseSkill>,
      AddExpertiseSkillPayload
    >(url, payload);
    if (!data.data) throw new Error(data.message || "Failed to add skill");
    return data.data;
  }

  async function deleteInstructorExpertiseSkillService(
    instructorId: string,
    skillRowId: string,
  ): Promise<void> {
    const url = buildQueryParams(routes.expertiseSkillByRow, undefined, {
      id: String(instructorId),
      skillRowId: String(skillRowId),
    });
    if (!url) throw new Error("Invalid delete skill URL");
    await methods.apiDelete<ApiResponse<null>>(url);
  }

  return {
    listInstructorExpertiseTopicsService,
    addInstructorExpertiseTopicService,
    deleteInstructorExpertiseTopicService,
    listInstructorExpertiseSkillsService,
    addInstructorExpertiseSkillService,
    deleteInstructorExpertiseSkillService,
  };
}
