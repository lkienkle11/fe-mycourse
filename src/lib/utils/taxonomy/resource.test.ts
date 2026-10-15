import { describe, expect, it } from "@jest/globals";
import type { TaxonomyTreeNode } from "@/types/taxonomy";
import {
  buildTaxonomyDagreRoot,
  collectTaxonomyTreeSlugs,
  createTaxonomyTreeNode,
  getTaxonomyTreeFromEntity,
  hasAdjustedTaxonomyTreeSlugs,
  toTaxonomyTreeWritePayload,
  validateTaxonomyTreeSlugs,
} from "./resource";

const stored: TaxonomyTreeNode[] = [
  {
    id: "n1",
    name: "Basics",
    slug: "basics",
    translations: { en: { name: "Basics" } },
    children: [{ id: "n2", name: "Intro", slug: "intro" }],
  },
  { id: "n3", name: "Advanced", slug: "advanced" },
];

describe("collectTaxonomyTreeSlugs", () => {
  it("maps every node id (any depth) to its stored slug", () => {
    expect(Array.from(collectTaxonomyTreeSlugs(stored).entries())).toEqual([
      ["n1", "basics"],
      ["n2", "intro"],
      ["n3", "advanced"],
    ]);
  });

  it("uses an empty string for a node without a slug", () => {
    expect(
      collectTaxonomyTreeSlugs([{ id: "x", name: "No slug" }]).get("x"),
    ).toBe("");
  });
});

describe("toTaxonomyTreeWritePayload", () => {
  const persisted = collectTaxonomyTreeSlugs(stored);

  it("omits the slug of untouched persisted nodes", () => {
    const payload = toTaxonomyTreeWritePayload(stored, persisted);

    expect(payload[0]).not.toHaveProperty("slug");
    expect(payload[0].children?.[0]).not.toHaveProperty("slug");
    expect(payload[1]).not.toHaveProperty("slug");
  });

  it("sends the slug of an edited persisted node (trimmed)", () => {
    const edited = [
      { ...stored[0], slug: " basics-v2 " },
      stored[1],
    ] satisfies TaxonomyTreeNode[];

    const payload = toTaxonomyTreeWritePayload(edited, persisted);

    expect(payload[0].slug).toBe("basics-v2");
    expect(payload[1]).not.toHaveProperty("slug");
  });

  it("sends a typed slug for a new node and omits a blank one", () => {
    const created = [
      ...stored,
      { id: "new1", name: "New", slug: "new-topic" },
      { id: "new2", name: "Blank", slug: "   " },
      { id: "new3", name: "Undefined" },
    ] satisfies TaxonomyTreeNode[];

    const payload = toTaxonomyTreeWritePayload(created, persisted);

    expect(payload[2].slug).toBe("new-topic");
    expect(payload[3]).not.toHaveProperty("slug");
    expect(payload[4]).not.toHaveProperty("slug");
  });

  it("treats every node as new when no persisted map is given (create)", () => {
    const payload = toTaxonomyTreeWritePayload([
      {
        id: "a",
        name: "A",
        slug: "a-slug",
        children: [{ id: "b", name: "B" }],
      },
    ]);

    expect(payload[0].slug).toBe("a-slug");
    expect(payload[0].children?.[0]).not.toHaveProperty("slug");
  });

  it("keeps id, name, translations and children shape; empty children become undefined", () => {
    const payload = toTaxonomyTreeWritePayload(stored, persisted);

    expect(payload[0]).toMatchObject({
      id: "n1",
      name: "Basics",
      translations: { en: { name: "Basics" } },
    });
    expect(payload[0].children?.[0]).toMatchObject({ id: "n2", name: "Intro" });
    expect(payload[1].children).toBeUndefined();
  });

  it("does not leak the response-only slug of persisted nodes", () => {
    expect(
      JSON.stringify(toTaxonomyTreeWritePayload(stored, persisted)),
    ).not.toContain("basics");
  });
});

describe("validateTaxonomyTreeSlugs", () => {
  const persisted = collectTaxonomyTreeSlugs(stored);

  it("returns no issues for an unchanged tree", () => {
    expect(validateTaxonomyTreeSlugs(stored, persisted)).toEqual({});
  });

  it("requires a non-blank slug for a persisted node", () => {
    const cleared = [{ ...stored[0], slug: "" }, stored[1]];
    expect(validateTaxonomyTreeSlugs(cleared, persisted)).toEqual({
      n1: "validation.slugRequired",
    });
  });

  it("allows a blank slug for a new node", () => {
    expect(
      validateTaxonomyTreeSlugs(
        [...stored, { id: "new", name: "New", slug: "" }],
        persisted,
      ),
    ).toEqual({});
  });

  it("reports malformed slugs at any depth", () => {
    const tree: TaxonomyTreeNode[] = [
      {
        id: "n1",
        name: "Basics",
        slug: "basics",
        children: [{ id: "n2", name: "Intro", slug: "-bad-" }],
      },
      { id: "new", name: "New", slug: "a".repeat(256) },
    ];
    expect(validateTaxonomyTreeSlugs(tree, persisted)).toEqual({
      n2: "validation.slugInvalid",
      new: "validation.slugMax",
    });
  });
});

describe("hasAdjustedTaxonomyTreeSlugs", () => {
  it("is true when a sent slug comes back different", () => {
    const sent = [{ id: "n1", name: "A", slug: "intro" }];
    const saved = [{ id: "n1", name: "A", slug: "intro-x7k92ab" }];
    expect(hasAdjustedTaxonomyTreeSlugs(sent, saved)).toBe(true);
  });

  it("is false when sent slugs equal the stored ones", () => {
    const sent = [{ id: "n1", name: "A", slug: "intro" }];
    expect(hasAdjustedTaxonomyTreeSlugs(sent, sent)).toBe(false);
  });

  it("ignores nodes without a sent slug", () => {
    const sent = [{ id: "n1", name: "A" }];
    const saved = [{ id: "n1", name: "A", slug: "generated" }];
    expect(hasAdjustedTaxonomyTreeSlugs(sent, saved)).toBe(false);
  });

  it("compares nested nodes by id", () => {
    const sent = [
      { id: "p", name: "P", children: [{ id: "c", name: "C", slug: "child" }] },
    ];
    const saved = [
      {
        id: "p",
        name: "P",
        slug: "p",
        children: [{ id: "c", name: "C", slug: "child-abc1234" }],
      },
    ];
    expect(hasAdjustedTaxonomyTreeSlugs(sent, saved)).toBe(true);
  });
});

describe("createTaxonomyTreeNode / getTaxonomyTreeFromEntity", () => {
  it("creates a node without a slug", () => {
    const node = createTaxonomyTreeNode("Sub topic");
    expect(node.slug).toBeUndefined();
    expect(node.name).toBe("Sub topic");
    expect(node.children).toEqual([]);
  });

  it("returns the stored tree of topics and skills and [] for others", () => {
    const topic = {
      id: "t",
      name: "T",
      slug: "t",
      status: "ACTIVE",
      created_at: 1,
      updated_at: 1,
      child_topics: stored,
    } as const;
    expect(getTaxonomyTreeFromEntity("topics", topic)).toBe(stored);
    expect(getTaxonomyTreeFromEntity("levels", topic)).toEqual([]);
    expect(getTaxonomyTreeFromEntity("topics", null)).toEqual([]);
  });

  it("keeps the raw node name in the dagre root", () => {
    const topic = {
      id: "t",
      name: "Topic",
      slug: "topic",
      status: "ACTIVE",
      created_at: 1,
      updated_at: 1,
      child_topics: stored,
    } as const;
    const root = buildTaxonomyDagreRoot("topics", topic);
    expect(root.name).toBe("Topic");
    expect(root.children?.[0].name).toBe("Basics");
  });
});
