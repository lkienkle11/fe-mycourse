import {
  createTaxonomyService,
  updateTaxonomyService,
} from "@/api/callers/taxonomy";
import {
  changedNonBlank,
  omitWhenBlank,
  payloadField,
} from "@/lib/utils/payload";
import { isSlugAdjusted } from "@/lib/utils/slug";
import type {
  CreateOutcomePayload,
  CreateSkillPayload,
  CreateSlugStatusPayload,
  CreateTopicPayload,
  TaxonomyEntity,
  TaxonomyNodeTranslation,
  TaxonomyOutcomeTranslation,
  TaxonomyResourceKey,
  TaxonomySlugBaseline,
  TaxonomyStatus,
  TaxonomyTreeNode,
  UpdateOutcomePayload,
  UpdateSkillPayload,
  UpdateSlugStatusPayload,
  UpdateTopicPayload,
} from "@/types/taxonomy";
import {
  compactNameTranslations,
  compactOutcomeTranslations,
  findOutcomeTranslationMissingShort,
} from "./form-helpers";
import {
  getTaxonomyTreeFromEntity,
  hasAdjustedTaxonomyTreeSlugs,
  toTaxonomyTreeWritePayload,
} from "./resource";

type FormMode = "create" | "edit";

/** Shared shape for dialog `FormValues` across resource schemas. */
export type TaxonomySubmitFormValues = {
  name?: string;
  slug?: string;
  short_description?: string;
  status: TaxonomyStatus | "ACTIVE" | "INACTIVE";
  image_file_id?: string;
};

type NameFormValues = {
  name: string;
  slug?: string;
  status: TaxonomySubmitFormValues["status"];
};
type TopicFormValues = NameFormValues & {
  image_file_id?: string;
};
type OutcomeFormValues = {
  short_description: string;
  status: TaxonomySubmitFormValues["status"];
  image_file_id?: string;
};

/** Body of a create/update request for any resource (without `expected_row_version`). */
export type TaxonomySubmitPayload =
  | CreateOutcomePayload
  | CreateTopicPayload
  | CreateSkillPayload
  | CreateSlugStatusPayload;

export type TaxonomySubmitValidationError = {
  kind: "missing_short";
  locale: string;
};

function resolveEnName(
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  fallbackName: string,
): string {
  return nameTranslations.en?.name?.trim() || fallbackName;
}

function compactEnNameTranslations(
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  name: string,
): Record<string, TaxonomyNodeTranslation> {
  return compactNameTranslations({
    ...nameTranslations,
    en: { name },
  });
}

/** Root `slug` key: only when non-blank and different from the persisted slug. */
function slugField(slug: string | undefined, baseline: TaxonomySlugBaseline) {
  return payloadField("slug", changedNonBlank(slug ?? "", baseline.slug));
}

export function prepareOutcomeSubmitPayload(
  values: OutcomeFormValues,
  outcomeTranslations: Record<string, TaxonomyOutcomeTranslation>,
):
  | { ok: true; payload: CreateOutcomePayload }
  | { ok: false; error: TaxonomySubmitValidationError } {
  const missingShortLocale =
    findOutcomeTranslationMissingShort(outcomeTranslations);
  if (missingShortLocale) {
    return {
      ok: false,
      error: { kind: "missing_short", locale: missingShortLocale },
    };
  }
  const en = outcomeTranslations.en ?? {
    short_description: values.short_description,
    description: [],
  };
  const translations = compactOutcomeTranslations({
    ...outcomeTranslations,
    en: {
      short_description: en.short_description,
      description: en.description ?? [""],
    },
  });
  return {
    ok: true,
    payload: {
      short_description: en.short_description,
      description: (en.description ?? []).filter(
        (line) => line.trim().length > 0,
      ),
      ...payloadField("image_file_id", omitWhenBlank(values.image_file_id)),
      status: values.status as TaxonomyStatus,
      translations,
    },
  };
}

export function prepareTopicSubmitPayload(
  values: TopicFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  tree: TaxonomyTreeNode[],
  baseline: TaxonomySlugBaseline,
): CreateTopicPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    ...slugField(values.slug, baseline),
    status: values.status as TaxonomyStatus,
    ...payloadField("image_file_id", omitWhenBlank(values.image_file_id)),
    child_topics: toTaxonomyTreeWritePayload(tree, baseline.treeSlugs),
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export function prepareSkillSubmitPayload(
  values: NameFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  tree: TaxonomyTreeNode[],
  baseline: TaxonomySlugBaseline,
): CreateSkillPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    ...slugField(values.slug, baseline),
    status: values.status as TaxonomyStatus,
    children: toTaxonomyTreeWritePayload(tree, baseline.treeSlugs),
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export function prepareSlugStatusSubmitPayload(
  values: NameFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  baseline: TaxonomySlugBaseline,
): CreateSlugStatusPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    ...slugField(values.slug, baseline),
    status: values.status as TaxonomyStatus,
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export async function persistTaxonomyCreate(
  resourceKey: TaxonomyResourceKey,
  payload: TaxonomySubmitPayload,
): Promise<TaxonomyEntity> {
  if (resourceKey === "outcomes") {
    return createTaxonomyService("outcomes", payload as CreateOutcomePayload);
  }
  if (resourceKey === "topics") {
    return createTaxonomyService("topics", payload as CreateTopicPayload);
  }
  if (resourceKey === "skills") {
    return createTaxonomyService("skills", payload as CreateSkillPayload);
  }
  return createTaxonomyService(resourceKey, payload as CreateSlugStatusPayload);
}

export async function persistTaxonomyUpdate(
  resourceKey: TaxonomyResourceKey,
  id: string,
  expectedRowVersion: number,
  payload: TaxonomySubmitPayload,
): Promise<TaxonomyEntity> {
  const withLock = { ...payload, expected_row_version: expectedRowVersion };
  if (resourceKey === "outcomes") {
    return updateTaxonomyService(
      "outcomes",
      id,
      withLock as UpdateOutcomePayload,
    );
  }
  if (resourceKey === "topics") {
    return updateTaxonomyService("topics", id, withLock as UpdateTopicPayload);
  }
  if (resourceKey === "skills") {
    return updateTaxonomyService("skills", id, withLock as UpdateSkillPayload);
  }
  return updateTaxonomyService(
    resourceKey,
    id,
    withLock as UpdateSlugStatusPayload,
  );
}

/** Creates or updates the entity and returns the saved entity (final slugs). */
export async function persistTaxonomyForm(
  resourceKey: TaxonomyResourceKey,
  mode: FormMode,
  entityId: string | undefined,
  expectedRowVersion: number,
  payload: TaxonomySubmitPayload,
): Promise<TaxonomyEntity> {
  if (mode === "create") {
    return persistTaxonomyCreate(resourceKey, payload);
  }
  if (!entityId) {
    throw new Error("Missing taxonomy entity id for update");
  }
  return persistTaxonomyUpdate(
    resourceKey,
    entityId,
    expectedRowVersion,
    payload,
  );
}

export type TaxonomySubmitBuildResult =
  | {
      ok: true;
      payload: TaxonomySubmitPayload;
    }
  | { ok: false; error: TaxonomySubmitValidationError };

/** Builds create/update body (without expected_row_version) for the resource. */
export function buildTaxonomySubmitPayload(args: {
  resourceKey: TaxonomyResourceKey;
  values: TaxonomySubmitFormValues;
  nameTranslations: Record<string, TaxonomyNodeTranslation>;
  outcomeTranslations: Record<string, TaxonomyOutcomeTranslation>;
  tree: TaxonomyTreeNode[];
  baseline: TaxonomySlugBaseline;
}): TaxonomySubmitBuildResult {
  const {
    resourceKey,
    values,
    nameTranslations,
    outcomeTranslations,
    tree,
    baseline,
  } = args;
  if (resourceKey === "outcomes") {
    return prepareOutcomeSubmitPayload(
      {
        short_description: values.short_description ?? "",
        status: values.status,
        image_file_id: values.image_file_id,
      },
      outcomeTranslations,
    );
  }
  if (resourceKey === "topics") {
    return {
      ok: true,
      payload: prepareTopicSubmitPayload(
        {
          name: values.name ?? "",
          slug: values.slug,
          status: values.status,
          image_file_id: values.image_file_id,
        },
        nameTranslations,
        tree,
        baseline,
      ),
    };
  }
  if (resourceKey === "skills") {
    return {
      ok: true,
      payload: prepareSkillSubmitPayload(
        { name: values.name ?? "", slug: values.slug, status: values.status },
        nameTranslations,
        tree,
        baseline,
      ),
    };
  }
  return {
    ok: true,
    payload: prepareSlugStatusSubmitPayload(
      { name: values.name ?? "", slug: values.slug, status: values.status },
      nameTranslations,
      baseline,
    ),
  };
}

export type TaxonomySaveSlugNotice = {
  /** Final stored slug when the backend changed the slug that was sent. */
  adjustedSlug?: string;
  /** A manually sent node slug came back different (in-tree collision). */
  treeAdjusted: boolean;
};

/** Compares what was sent with what the backend stored (final slugs). */
export function getTaxonomySaveSlugNotice(
  resourceKey: TaxonomyResourceKey,
  payload: TaxonomySubmitPayload,
  saved: TaxonomyEntity,
): TaxonomySaveSlugNotice {
  const sentSlug = "slug" in payload ? payload.slug : undefined;
  const savedSlug = "slug" in saved ? saved.slug : "";
  const sentTree =
    "child_topics" in payload
      ? payload.child_topics
      : "children" in payload
        ? payload.children
        : undefined;
  return {
    adjustedSlug: isSlugAdjusted(sentSlug, savedSlug) ? savedSlug : undefined,
    treeAdjusted: hasAdjustedTaxonomyTreeSlugs(
      sentTree ?? [],
      getTaxonomyTreeFromEntity(resourceKey, saved),
    ),
  };
}
