import {
  createTaxonomyService,
  updateTaxonomyService,
} from "@/api/callers/taxonomy";
import type {
  CreateOutcomePayload,
  CreateSkillPayload,
  CreateSlugStatusPayload,
  CreateTopicPayload,
  TaxonomyNodeTranslation,
  TaxonomyOutcomeTranslation,
  TaxonomyResourceKey,
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
import { toTaxonomyTreeWritePayload } from "./resource";

type FormMode = "create" | "edit";

/** Shared shape for dialog `FormValues` across resource schemas. */
export type TaxonomySubmitFormValues = {
  name?: string;
  short_description?: string;
  status: TaxonomyStatus | "ACTIVE" | "INACTIVE";
  image_file_id?: string;
};

type NameFormValues = {
  name: string;
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
      image_file_id: values.image_file_id || undefined,
      status: values.status as TaxonomyStatus,
      translations,
    },
  };
}

export function prepareTopicSubmitPayload(
  values: TopicFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  tree: TaxonomyTreeNode[],
): CreateTopicPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    status: values.status as TaxonomyStatus,
    image_file_id: values.image_file_id || undefined,
    child_topics: toTaxonomyTreeWritePayload(tree),
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export function prepareSkillSubmitPayload(
  values: NameFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
  tree: TaxonomyTreeNode[],
): CreateSkillPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    status: values.status as TaxonomyStatus,
    children: toTaxonomyTreeWritePayload(tree),
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export function prepareSlugStatusSubmitPayload(
  values: NameFormValues,
  nameTranslations: Record<string, TaxonomyNodeTranslation>,
): CreateSlugStatusPayload {
  const name = resolveEnName(nameTranslations, values.name);
  return {
    name,
    status: values.status as TaxonomyStatus,
    translations: compactEnNameTranslations(nameTranslations, name),
  };
}

export async function persistTaxonomyCreate(
  resourceKey: TaxonomyResourceKey,
  payload:
    | CreateOutcomePayload
    | CreateTopicPayload
    | CreateSkillPayload
    | CreateSlugStatusPayload,
): Promise<void> {
  if (resourceKey === "outcomes") {
    await createTaxonomyService("outcomes", payload as CreateOutcomePayload);
    return;
  }
  if (resourceKey === "topics") {
    await createTaxonomyService("topics", payload as CreateTopicPayload);
    return;
  }
  if (resourceKey === "skills") {
    await createTaxonomyService("skills", payload as CreateSkillPayload);
    return;
  }
  await createTaxonomyService(resourceKey, payload as CreateSlugStatusPayload);
}

export async function persistTaxonomyUpdate(
  resourceKey: TaxonomyResourceKey,
  id: string,
  expectedRowVersion: number,
  payload:
    | CreateOutcomePayload
    | CreateTopicPayload
    | CreateSkillPayload
    | CreateSlugStatusPayload,
): Promise<void> {
  const withLock = { ...payload, expected_row_version: expectedRowVersion };
  if (resourceKey === "outcomes") {
    await updateTaxonomyService(
      "outcomes",
      id,
      withLock as UpdateOutcomePayload,
    );
    return;
  }
  if (resourceKey === "topics") {
    await updateTaxonomyService("topics", id, withLock as UpdateTopicPayload);
    return;
  }
  if (resourceKey === "skills") {
    await updateTaxonomyService("skills", id, withLock as UpdateSkillPayload);
    return;
  }
  await updateTaxonomyService(
    resourceKey,
    id,
    withLock as UpdateSlugStatusPayload,
  );
}

export async function persistTaxonomyForm(
  resourceKey: TaxonomyResourceKey,
  mode: FormMode,
  entityId: string | undefined,
  expectedRowVersion: number,
  payload:
    | CreateOutcomePayload
    | CreateTopicPayload
    | CreateSkillPayload
    | CreateSlugStatusPayload,
): Promise<void> {
  if (mode === "create") {
    await persistTaxonomyCreate(resourceKey, payload);
    return;
  }
  if (!entityId) {
    throw new Error("Missing taxonomy entity id for update");
  }
  await persistTaxonomyUpdate(
    resourceKey,
    entityId,
    expectedRowVersion,
    payload,
  );
}

export type TaxonomySubmitBuildResult =
  | {
      ok: true;
      payload:
        | CreateOutcomePayload
        | CreateTopicPayload
        | CreateSkillPayload
        | CreateSlugStatusPayload;
    }
  | { ok: false; error: TaxonomySubmitValidationError };

/** Builds create/update body (without expected_row_version) for the resource. */
export function buildTaxonomySubmitPayload(args: {
  resourceKey: TaxonomyResourceKey;
  values: TaxonomySubmitFormValues;
  nameTranslations: Record<string, TaxonomyNodeTranslation>;
  outcomeTranslations: Record<string, TaxonomyOutcomeTranslation>;
  tree: TaxonomyTreeNode[];
}): TaxonomySubmitBuildResult {
  const { resourceKey, values, nameTranslations, outcomeTranslations, tree } =
    args;
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
          status: values.status,
          image_file_id: values.image_file_id,
        },
        nameTranslations,
        tree,
      ),
    };
  }
  if (resourceKey === "skills") {
    return {
      ok: true,
      payload: prepareSkillSubmitPayload(
        { name: values.name ?? "", status: values.status },
        nameTranslations,
        tree,
      ),
    };
  }
  return {
    ok: true,
    payload: prepareSlugStatusSubmitPayload(
      { name: values.name ?? "", status: values.status },
      nameTranslations,
    ),
  };
}
