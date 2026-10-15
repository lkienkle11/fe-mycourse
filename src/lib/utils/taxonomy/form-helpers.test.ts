import { describe, expect, it } from "@jest/globals";
import type {
  CourseSkill,
  CourseTopic,
  SlugStatusTaxonomy,
} from "@/types/taxonomy";
import {
  buildTaxonomyFormDefaultValues,
  buildTaxonomySlugBaseline,
  getPersistedTaxonomySlug,
} from "./form-helpers";

const level: SlugStatusTaxonomy = {
  id: "level-1",
  name: "Beginner",
  slug: "beginner",
  status: "ACTIVE",
  created_at: 1,
  updated_at: 1,
};

const topic: CourseTopic = {
  id: "topic-1",
  name: "Backend",
  slug: "backend",
  status: "ACTIVE",
  created_at: 1,
  updated_at: 1,
  child_topics: [
    {
      id: "node-1",
      name: "Go",
      slug: "go",
      children: [{ id: "node-2", name: "Gin", slug: "gin" }],
    },
  ],
};

const skill: CourseSkill = {
  id: "skill-1",
  name: "Programming",
  slug: "programming",
  status: "ACTIVE",
  created_at: 1,
  updated_at: 1,
  children: [{ id: "node-1", name: "Go", slug: "go" }],
};

describe("getPersistedTaxonomySlug", () => {
  it("returns the stored slug for slug-bearing resources", () => {
    expect(getPersistedTaxonomySlug("levels", level)).toBe("beginner");
    expect(getPersistedTaxonomySlug("topics", topic)).toBe("backend");
  });

  it("is blank on create and for outcomes", () => {
    expect(getPersistedTaxonomySlug("levels", null)).toBe("");
    expect(getPersistedTaxonomySlug("outcomes", undefined)).toBe("");
  });
});

describe("buildTaxonomyFormDefaultValues slug", () => {
  it("seeds the persisted slug in edit mode and a blank slug in create mode", () => {
    expect(buildTaxonomyFormDefaultValues("levels", level)).toMatchObject({
      slug: "beginner",
    });
    expect(buildTaxonomyFormDefaultValues("tags", null)).toMatchObject({
      slug: "",
    });
  });

  it("does not seed a slug for outcomes", () => {
    expect(buildTaxonomyFormDefaultValues("outcomes", null)).not.toHaveProperty(
      "slug",
    );
  });
});

describe("buildTaxonomySlugBaseline", () => {
  it("captures the root slug and every nested node slug by id", () => {
    const baseline = buildTaxonomySlugBaseline("topics", topic);
    expect(baseline.slug).toBe("backend");
    expect([...baseline.treeSlugs]).toEqual([
      ["node-1", "go"],
      ["node-2", "gin"],
    ]);
  });

  it("reads skill children", () => {
    expect([...buildTaxonomySlugBaseline("skills", skill).treeSlugs]).toEqual([
      ["node-1", "go"],
    ]);
  });

  it("is empty for create and for resources without a tree", () => {
    const created = buildTaxonomySlugBaseline("topics", null);
    expect(created.slug).toBe("");
    expect(created.treeSlugs.size).toBe(0);
    expect(buildTaxonomySlugBaseline("levels", level).treeSlugs.size).toBe(0);
  });
});
