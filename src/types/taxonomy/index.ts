import type { ApiEntityStatus, ApiListQueryParams } from "@/types/api";

/** Taxonomy row status — alias of shared BE list filter status. */
export type TaxonomyStatus = ApiEntityStatus;

/** Recursive tree node stored in JSONB (`child_topics` or `children`). */
export type TaxonomyTreeNode = {
  id: string;
  name: string;
  slug: string;
  children?: TaxonomyTreeNode[];
};

export type TaxonomyResourceKey =
  | "levels"
  | "topics"
  | "outcomes"
  | "skills"
  | "tags";

/** List query params for taxonomy list endpoints (shared BE pagination shape). */
export type TaxonomyListFilters = ApiListQueryParams;

export type SlugStatusTaxonomy = {
  id: number;
  name: string;
  slug: string;
  status: TaxonomyStatus;
  created_by?: number;
  created_at: number;
  updated_at: number;
};

export type CourseTopic = SlugStatusTaxonomy & {
  image_file_id?: string;
  image_file_url?: string;
  child_topics: TaxonomyTreeNode[];
};

export type CourseSkill = SlugStatusTaxonomy & {
  children: TaxonomyTreeNode[];
};

export type CourseOutcome = {
  id: number;
  short_description: string;
  description: string[];
  image_file_id?: string;
  image_file_url?: string;
  status: TaxonomyStatus;
  created_by?: number;
  created_at: number;
  updated_at: number;
};

export type TaxonomyEntityMap = {
  levels: SlugStatusTaxonomy;
  tags: SlugStatusTaxonomy;
  topics: CourseTopic;
  skills: CourseSkill;
  outcomes: CourseOutcome;
};

export type TaxonomyEntity = TaxonomyEntityMap[TaxonomyResourceKey];

export type CreateSlugStatusPayload = {
  name: string;
  slug: string;
  status?: TaxonomyStatus;
};

export type UpdateSlugStatusPayload = {
  name?: string;
  slug?: string;
  status?: TaxonomyStatus;
};

export type CreateTopicPayload = CreateSlugStatusPayload & {
  image_file_id?: string;
  child_topics?: TaxonomyTreeNode[];
};

export type UpdateTopicPayload = {
  name?: string;
  slug?: string;
  image_file_id?: string;
  child_topics?: TaxonomyTreeNode[];
  status?: TaxonomyStatus;
};

export type CreateSkillPayload = CreateSlugStatusPayload & {
  children?: TaxonomyTreeNode[];
};

export type UpdateSkillPayload = {
  name?: string;
  slug?: string;
  children?: TaxonomyTreeNode[];
  status?: TaxonomyStatus;
};

export type CreateOutcomePayload = {
  short_description: string;
  description?: string[];
  image_file_id?: string;
  status?: TaxonomyStatus;
};

export type UpdateOutcomePayload = {
  short_description?: string;
  description?: string[];
  image_file_id?: string;
  status?: TaxonomyStatus;
};

export type CreateTaxonomyPayloadMap = {
  levels: CreateSlugStatusPayload;
  tags: CreateSlugStatusPayload;
  topics: CreateTopicPayload;
  skills: CreateSkillPayload;
  outcomes: CreateOutcomePayload;
};

export type UpdateTaxonomyPayloadMap = {
  levels: UpdateSlugStatusPayload;
  tags: UpdateSlugStatusPayload;
  topics: UpdateTopicPayload;
  skills: UpdateSkillPayload;
  outcomes: UpdateOutcomePayload;
};

/** Count nodes in a taxonomy tree (for list column display). */
export function countTaxonomyTreeNodes(
  nodes: TaxonomyTreeNode[] | undefined,
): number {
  if (!nodes?.length) return 0;
  let count = 0;
  for (const node of nodes) {
    count += 1;
    count += countTaxonomyTreeNodes(node.children);
  }
  return count;
}
