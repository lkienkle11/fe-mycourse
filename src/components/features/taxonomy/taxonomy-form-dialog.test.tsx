import { describe, expect, it, jest } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { toast } from "sonner";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import type {
  CourseSkill,
  CourseTopic,
  SlugStatusTaxonomy,
  TaxonomyEntity,
  TaxonomyResourceKey,
} from "@/types/taxonomy";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

type CapturedBody = Record<string, unknown>;

const SLUG_RESOURCES = ["levels", "tags", "topics", "skills"] as const;

function savedEntity(
  resourceKey: TaxonomyResourceKey,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "row-1",
    name: "Saved",
    slug: "saved",
    status: "ACTIVE",
    row_version: 2,
    ...(resourceKey === "topics" ? { child_topics: [] } : {}),
    ...(resourceKey === "skills" ? { children: [] } : {}),
    ...overrides,
  };
}

function ok(data: unknown) {
  return HttpResponse.json({ code: 0, message: "ok", data });
}

function conflict(recommendedSlug: string) {
  return HttpResponse.json(
    {
      code: 3007,
      message: "Slug already exists",
      data: { recommended_slug: recommendedSlug },
    },
    { status: 409 },
  );
}

/** Captures every request body sent to the collection route (create). */
function captureCreate(
  resourceKey: TaxonomyResourceKey,
  respond: (body: CapturedBody, call: number) => Response,
) {
  const bodies: CapturedBody[] = [];
  server.use(
    http.post(`*/api/v1/taxonomy/${resourceKey}`, async ({ request }) => {
      const body = (await request.json()) as CapturedBody;
      bodies.push(body);
      return respond(body, bodies.length);
    }),
  );
  return bodies;
}

/** Captures every request body sent to the item route (update). */
function captureUpdate(
  resourceKey: TaxonomyResourceKey,
  respond: (body: CapturedBody) => Response,
) {
  const bodies: CapturedBody[] = [];
  server.use(
    http.patch(
      `*/api/v1/taxonomy/${resourceKey}/row-1`,
      async ({ request }) => {
        const body = (await request.json()) as CapturedBody;
        bodies.push(body);
        return respond(body);
      },
    ),
  );
  return bodies;
}

function renderDialog(props: {
  resourceKey: TaxonomyResourceKey;
  mode: "create" | "edit";
  initialData?: TaxonomyEntity | null;
}) {
  const onSuccess = jest.fn<() => void>();
  const onOpenChange = jest.fn<(open: boolean) => void>();
  const view = renderWithProviders(
    <TaxonomyFormDialog
      open
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      {...props}
    />,
  );
  return { ...view, onSuccess, onOpenChange };
}

function nameInput() {
  return screen.getByRole("textbox", { name: /^Name/ });
}

function slugInput() {
  return screen.getByRole("textbox", { name: /^Slug/ });
}

/** The inline slug input of the single tree node ("Sub-topic slug" / "Sub-skill slug"). */
function nodeSlugInput() {
  return screen.getByRole("textbox", { name: /^Sub-(topic|skill) slug$/ });
}

function saveButton() {
  return screen.getByRole("button", { name: "Save" });
}

const topicEntity: CourseTopic = {
  id: "row-1",
  name: "Backend",
  slug: "backend",
  status: "ACTIVE",
  created_at: 1,
  updated_at: 1,
  row_version: 3,
  child_topics: [{ id: "node-1", name: "Go", slug: "go" }],
};

const skillEntity: CourseSkill = {
  id: "row-1",
  name: "Programming",
  slug: "programming",
  status: "ACTIVE",
  created_at: 1,
  updated_at: 1,
  row_version: 3,
  children: [{ id: "node-1", name: "Go", slug: "go" }],
};

function slugStatusEntity(slug = "beginner"): SlugStatusTaxonomy {
  return {
    id: "row-1",
    name: "Beginner",
    slug,
    status: "ACTIVE",
    created_at: 1,
    updated_at: 1,
    row_version: 3,
  };
}

describe("TaxonomyFormDialog slug management", () => {
  describe.each(SLUG_RESOURCES)("%s create", (resourceKey) => {
    it("omits a blank slug so the backend generates it", async () => {
      const bodies = captureCreate(resourceKey, () =>
        ok(savedEntity(resourceKey, { slug: "go" })),
      );
      const { user, onSuccess } = renderDialog({ resourceKey, mode: "create" });

      await user.type(nameInput(), "Go");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(bodies).toHaveLength(1);
      expect("slug" in bodies[0]).toBe(false);
      expect(bodies[0].name).toBe("Go");
    });

    it("sends a typed slug", async () => {
      const bodies = captureCreate(resourceKey, (body) =>
        ok(savedEntity(resourceKey, { slug: body.slug })),
      );
      const { user, onSuccess } = renderDialog({ resourceKey, mode: "create" });

      await user.type(nameInput(), "Go");
      await user.type(slugInput(), "golang-basics");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(bodies[0].slug).toBe("golang-basics");
    });

    it("asks to use the recommended slug on 409/3007 and retries with it on Yes", async () => {
      const bodies = captureCreate(resourceKey, (body, call) =>
        call === 1
          ? conflict("golang-x7k92ab")
          : ok(savedEntity(resourceKey, { slug: body.slug })),
      );
      const { user, onSuccess } = renderDialog({ resourceKey, mode: "create" });

      await user.type(nameInput(), "Go");
      await user.type(slugInput(), "golang");
      await user.click(saveButton());

      expect(
        await screen.findByText(/We suggest: golang-x7k92ab/),
      ).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Yes" }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(bodies.map((body) => body.slug)).toEqual([
        "golang",
        "golang-x7k92ab",
      ]);
    });

    it("keeps the form open and sends nothing more on No", async () => {
      const bodies = captureCreate(resourceKey, () =>
        conflict("golang-x7k92ab"),
      );
      const { user, onSuccess } = renderDialog({ resourceKey, mode: "create" });

      await user.type(nameInput(), "Go");
      await user.type(slugInput(), "golang");
      await user.click(saveButton());
      await screen.findByText(/We suggest: golang-x7k92ab/);

      await user.click(screen.getByRole("button", { name: "No" }));

      await waitFor(() =>
        expect(screen.queryByText(/We suggest:/)).not.toBeInTheDocument(),
      );
      expect(bodies).toHaveLength(1);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(slugInput()).toHaveValue("golang");
    });
  });

  describe.each(SLUG_RESOURCES)("%s edit", (resourceKey) => {
    const initialData: TaxonomyEntity =
      resourceKey === "topics"
        ? topicEntity
        : resourceKey === "skills"
          ? skillEntity
          : slugStatusEntity();

    it("shows the persisted slug and omits it when only the name changes", async () => {
      const bodies = captureUpdate(resourceKey, () =>
        ok(savedEntity(resourceKey, { slug: initialData.slug })),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey,
        mode: "edit",
        initialData,
      });

      expect(slugInput()).toHaveValue((initialData as SlugStatusTaxonomy).slug);

      await user.type(nameInput(), " renamed");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(bodies).toHaveLength(1);
      expect("slug" in bodies[0]).toBe(false);
      expect(bodies[0].expected_row_version).toBe(3);
    });

    it("sends a changed slug and reports it when the backend adjusted it", async () => {
      const info = jest.spyOn(toast, "info").mockReturnValue("toast-id");
      const bodies = captureUpdate(resourceKey, () =>
        ok(savedEntity(resourceKey, { slug: "advanced-x7k92ab" })),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey,
        mode: "edit",
        initialData,
      });

      await user.clear(slugInput());
      await user.type(slugInput(), "advanced");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(bodies[0].slug).toBe("advanced");
      expect(info).toHaveBeenCalledWith(
        "Saved. The slug was already taken, so it was changed to advanced-x7k92ab.",
      );
      info.mockRestore();
    });

    it("blocks a blank slug without calling the backend", async () => {
      const bodies = captureUpdate(resourceKey, () =>
        ok(savedEntity(resourceKey)),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey,
        mode: "edit",
        initialData,
      });

      await user.clear(slugInput());
      await user.click(saveButton());

      expect(
        await screen.findByText("Please enter a slug."),
      ).toBeInTheDocument();
      expect(bodies).toHaveLength(0);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("outcomes", () => {
    it("has no slug field and never sends a slug", async () => {
      const bodies = captureCreate("outcomes", () =>
        ok({
          id: "row-1",
          short_description: "Build APIs",
          description: [],
          status: "ACTIVE",
        }),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey: "outcomes",
        mode: "create",
      });

      expect(
        screen.queryByRole("textbox", { name: /^Slug/ }),
      ).not.toBeInTheDocument();

      await user.type(
        screen.getByRole("textbox", { name: /^Short description/ }),
        "Build APIs",
      );
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect("slug" in bodies[0]).toBe(false);
    });
  });

  describe("tree node slugs", () => {
    it("omits an untouched node slug and sends an edited one", async () => {
      const bodies = captureUpdate("topics", () =>
        ok(
          savedEntity("topics", {
            slug: "backend",
            child_topics: [{ id: "node-1", name: "Go", slug: "golang" }],
          }),
        ),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey: "topics",
        mode: "edit",
        initialData: topicEntity,
      });

      await user.click(screen.getByRole("button", { name: "Edit slug" }));
      const nodeSlug = nodeSlugInput();
      await user.clear(nodeSlug);
      await user.type(nodeSlug, "golang");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      const nodes = bodies[0].child_topics as CapturedBody[];
      expect(nodes[0].id).toBe("node-1");
      expect(nodes[0].slug).toBe("golang");
    });

    it("does not send the slug of a node that was not edited", async () => {
      const bodies = captureUpdate("skills", () =>
        ok(savedEntity("skills", { slug: "programming" })),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey: "skills",
        mode: "edit",
        initialData: skillEntity,
      });

      await user.type(nameInput(), " renamed");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      const nodes = bodies[0].children as CapturedBody[];
      expect(nodes).toHaveLength(1);
      expect("slug" in nodes[0]).toBe(false);
    });

    it("blocks a cleared persisted node slug and marks the node", async () => {
      const errorToast = jest.spyOn(toast, "error").mockReturnValue("toast-id");
      const bodies = captureUpdate("topics", () => ok(savedEntity("topics")));
      const { user, onSuccess } = renderDialog({
        resourceKey: "topics",
        mode: "edit",
        initialData: topicEntity,
      });

      await user.click(screen.getByRole("button", { name: "Edit slug" }));
      await user.clear(nodeSlugInput());
      await user.click(saveButton());

      expect(
        await screen.findByText("Please enter a slug."),
      ).toBeInTheDocument();
      expect(nodeSlugInput()).toHaveAttribute("aria-invalid", "true");
      expect(errorToast).toHaveBeenCalledWith(
        "Fix the highlighted sub-item slugs before saving.",
      );
      expect(bodies).toHaveLength(0);
      expect(onSuccess).not.toHaveBeenCalled();
      errorToast.mockRestore();
    });

    it("notifies when a manually sent node slug came back adjusted", async () => {
      const info = jest.spyOn(toast, "info").mockReturnValue("toast-id");
      captureUpdate("skills", () =>
        ok(
          savedEntity("skills", {
            slug: "programming",
            children: [{ id: "node-1", name: "Go", slug: "go-x7k92ab" }],
          }),
        ),
      );
      const { user, onSuccess } = renderDialog({
        resourceKey: "skills",
        mode: "edit",
        initialData: skillEntity,
      });

      await user.click(screen.getByRole("button", { name: "Edit slug" }));
      const nodeSlug = nodeSlugInput();
      await user.clear(nodeSlug);
      await user.type(nodeSlug, "go-lang");
      await user.click(saveButton());

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(info).toHaveBeenCalledWith(
        "Saved. Some sub-item slugs were already used in this tree and were adjusted to stay unique.",
      );
      info.mockRestore();
    });
  });
});
