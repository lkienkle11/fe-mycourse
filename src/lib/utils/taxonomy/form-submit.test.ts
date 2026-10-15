import { describe, expect, it } from "@jest/globals";
import type {
  CourseSkill,
  CourseTopic,
  TaxonomySlugBaseline,
  TaxonomyTreeNode,
} from "@/types/taxonomy";
import {
  buildTaxonomySubmitPayload,
  getTaxonomySaveSlugNotice,
  type TaxonomySubmitFormValues,
} from "./form-submit";

const emptyBaseline: TaxonomySlugBaseline = {
  slug: "",
  treeSlugs: new Map(),
};

const editBaseline: TaxonomySlugBaseline = {
  slug: "backend",
  treeSlugs: new Map([["node-1", "go"]]),
};

function build(
  resourceKey: Parameters<typeof buildTaxonomySubmitPayload>[0]["resourceKey"],
  values: Partial<TaxonomySubmitFormValues>,
  baseline: TaxonomySlugBaseline,
  tree: TaxonomyTreeNode[] = [],
) {
  const result = buildTaxonomySubmitPayload({
    resourceKey,
    values: { name: "Backend", status: "ACTIVE", ...values },
    nameTranslations: { en: { name: "Backend" } },
    outcomeTranslations: {},
    tree,
    baseline,
  });
  if (!result.ok) throw new Error("expected a payload");
  return result.payload as unknown as Record<string, unknown>;
}

describe("buildTaxonomySubmitPayload slug", () => {
  it.each([
    "levels",
    "tags",
    "topics",
    "skills",
  ] as const)("%s: omits a blank slug on create", (resourceKey) => {
    expect("slug" in build(resourceKey, { slug: "  " }, emptyBaseline)).toBe(
      false,
    );
  });

  it.each([
    "levels",
    "tags",
    "topics",
    "skills",
  ] as const)("%s: sends a trimmed typed slug on create", (resourceKey) => {
    expect(build(resourceKey, { slug: " golang " }, emptyBaseline).slug).toBe(
      "golang",
    );
  });

  it("omits the slug when it equals the persisted one (rename only)", () => {
    const payload = build("topics", { slug: "backend" }, editBaseline);
    expect("slug" in payload).toBe(false);
    expect(payload.name).toBe("Backend");
  });

  it("sends the slug when it differs from the persisted one", () => {
    expect(build("levels", { slug: "advanced" }, editBaseline).slug).toBe(
      "advanced",
    );
  });

  it("never emits a slug for outcomes", () => {
    const result = buildTaxonomySubmitPayload({
      resourceKey: "outcomes",
      values: { short_description: "Build APIs", status: "ACTIVE" },
      nameTranslations: {},
      outcomeTranslations: {
        en: { short_description: "Build APIs", description: [""] },
      },
      tree: [],
      baseline: emptyBaseline,
    });
    expect(result.ok).toBe(true);
    expect(result.ok && "slug" in result.payload).toBe(false);
  });

  it("writes node slugs only when new or changed", () => {
    const tree: TaxonomyTreeNode[] = [
      { id: "node-1", name: "Go", slug: "go" },
      { id: "node-2", name: "Gin", slug: "gin-web" },
      { id: "node-3", name: "Echo", slug: "" },
    ];
    const nodes = build("topics", { slug: "backend" }, editBaseline, tree)
      .child_topics as Array<Record<string, unknown>>;
    expect("slug" in nodes[0]).toBe(false);
    expect(nodes[1].slug).toBe("gin-web");
    expect("slug" in nodes[2]).toBe(false);
  });
});

describe("getTaxonomySaveSlugNotice", () => {
  const savedTopic: CourseTopic = {
    id: "topic-1",
    name: "Backend",
    slug: "backend-x7k92ab",
    status: "ACTIVE",
    created_at: 1,
    updated_at: 1,
    child_topics: [{ id: "node-1", name: "Go", slug: "go" }],
  };

  it("reports the stored slug when it differs from the one sent", () => {
    const notice = getTaxonomySaveSlugNotice(
      "topics",
      { slug: "backend" } as never,
      savedTopic,
    );
    expect(notice.adjustedSlug).toBe("backend-x7k92ab");
    expect(notice.treeAdjusted).toBe(false);
  });

  it("reports nothing when no slug was sent", () => {
    const notice = getTaxonomySaveSlugNotice("topics", {} as never, savedTopic);
    expect(notice.adjustedSlug).toBeUndefined();
  });

  it("flags a manually sent node slug that came back different", () => {
    const savedSkill: CourseSkill = {
      id: "skill-1",
      name: "Programming",
      slug: "programming",
      status: "ACTIVE",
      created_at: 1,
      updated_at: 1,
      children: [{ id: "node-1", name: "Go", slug: "go-x7k92ab" }],
    };
    const notice = getTaxonomySaveSlugNotice(
      "skills",
      { children: [{ id: "node-1", name: "Go", slug: "go" }] } as never,
      savedSkill,
    );
    expect(notice.treeAdjusted).toBe(true);
  });
});
