import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en";
import { server } from "@/test-support/msw/server";
import type { CourseDetail, CourseSection } from "@/types/course";
import { useCourseOutlineReorder } from "./use-course-outline-reorder";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function buildSection(overrides: Partial<CourseSection> = {}): CourseSection {
  return {
    id: overrides.id ?? "sec-1",
    stable_id: overrides.stable_id ?? "sec-1-stable",
    title: "Section",
    description: "",
    order_index: 0,
    row_version: 1,
    lessons: [],
    ...overrides,
  };
}

function buildDetail(outline: CourseSection[]): CourseDetail {
  return {
    course: { id: "course-1" } as CourseDetail["course"],
    collaborator_role: "OWNER" as CourseDetail["collaborator_role"],
    collaborators: [],
    outline,
  };
}

function setup(initialOutline: CourseSection[]) {
  let detail = buildDetail(initialOutline);
  const mutateDetail = jest.fn(async (updater: unknown) => {
    detail =
      typeof updater === "function"
        ? (updater as (d: CourseDetail) => CourseDetail)(detail)
        : (updater as CourseDetail);
    return detail;
  });
  return { mutateDetail, getDetail: () => detail };
}

type RenderReorderHookOptions = {
  acquireLease?: (
    resourceType: string,
    resourceStableId: string,
  ) => Promise<{ id: string } | null>;
  releaseLease?: () => Promise<void>;
};

/** Shared `renderHook(useCourseOutlineReorder)` setup — grants the lease by default. */
function renderReorderHook(
  initialOutline: CourseSection[],
  { acquireLease, releaseLease }: RenderReorderHookOptions = {},
) {
  const { mutateDetail, getDetail } = setup(initialOutline);
  const acquire = jest.fn(acquireLease ?? (async () => ({ id: "lease-1" })));
  const release = jest.fn(releaseLease ?? (async () => {}));

  const { result } = renderHook(
    () =>
      useCourseOutlineReorder({
        courseId: "course-1",
        courseDetail: getDetail(),
        mutateDetail: mutateDetail as never,
        acquireLease: acquire,
        releaseLease: release,
        tSuccess: (key) => key,
        tErrors: (key) => key,
      }),
    { wrapper },
  );

  return {
    result,
    getDetail,
    mutateDetail,
    acquireLease: acquire,
    releaseLease: release,
  };
}

describe("useCourseOutlineReorder — sections", () => {
  const original = [
    buildSection({ id: "sec-1", stable_id: "s1", order_index: 0 }),
    buildSection({ id: "sec-2", stable_id: "s2", order_index: 1 }),
  ];

  it("applies the optimistic order immediately, then merges the persisted result", async () => {
    server.use(
      http.post("*/api/v1/courses/:courseId/sections/reorder", () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: [
            { ...original[1], order_index: 0 },
            { ...original[0], order_index: 1 },
          ],
        }),
      ),
    );
    const { result, getDetail, acquireLease, releaseLease } =
      renderReorderHook(original);

    act(() => {
      result.current.handleReorderSections([original[1], original[0]]);
    });

    // Optimistic reorder is applied before the persist request resolves.
    await waitFor(() =>
      expect(getDetail().outline.map((s) => s.stable_id)).toEqual(["s2", "s1"]),
    );

    await waitFor(() => expect(releaseLease).toHaveBeenCalledTimes(1));
    expect(acquireLease).toHaveBeenCalledWith("OUTLINE_ROOT", "course-1");
    expect(getDetail().outline.map((s) => s.stable_id)).toEqual(["s2", "s1"]);
  });

  it("rolls back to the snapshot and never persists when the lease is denied", async () => {
    const persistSpy = jest.fn();
    server.use(
      http.post("*/api/v1/courses/:courseId/sections/reorder", () => {
        persistSpy();
        return HttpResponse.json({ code: 0, message: "ok", data: [] });
      }),
    );
    const { result, getDetail, releaseLease } = renderReorderHook(original, {
      acquireLease: async () => null,
    });

    await act(async () => {
      result.current.handleReorderSections([original[1], original[0]]);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(getDetail().outline.map((s) => s.stable_id)).toEqual(["s1", "s2"]),
    );
    expect(persistSpy).not.toHaveBeenCalled();
    expect(releaseLease).not.toHaveBeenCalled();
  });

  it("rolls back to the snapshot and releases the lease when persist rejects", async () => {
    server.use(
      http.post("*/api/v1/courses/:courseId/sections/reorder", () =>
        HttpResponse.json(
          { code: 500, message: "server error", data: null },
          { status: 500 },
        ),
      ),
    );
    const { result, getDetail, releaseLease } = renderReorderHook(original);

    act(() => {
      result.current.handleReorderSections([original[1], original[0]]);
    });

    await waitFor(() => expect(releaseLease).toHaveBeenCalledTimes(1));
    expect(getDetail().outline.map((s) => s.stable_id)).toEqual(["s1", "s2"]);
  });

  it("handleReverseSections reverses the current outline order", async () => {
    server.use(
      http.post("*/api/v1/courses/:courseId/sections/reorder", () =>
        HttpResponse.json({ code: 0, message: "ok", data: [] }),
      ),
    );
    const { result, getDetail } = renderReorderHook(original);

    act(() => {
      result.current.handleReverseSections(original);
    });

    await waitFor(() =>
      expect(getDetail().outline.map((s) => s.stable_id)).toEqual(["s2", "s1"]),
    );
  });
});

describe("useCourseOutlineReorder — lessons and sub-lessons", () => {
  it("reorders lessons within a section and merges the persisted result", async () => {
    const section = buildSection({
      id: "sec-1",
      stable_id: "s1",
      lessons: [
        {
          id: "l1",
          stable_id: "l1",
          title: "L1",
          summary: "",
          order_index: 0,
          row_version: 1,
          sub_lessons: [],
        },
        {
          id: "l2",
          stable_id: "l2",
          title: "L2",
          summary: "",
          order_index: 1,
          row_version: 1,
          sub_lessons: [],
        },
      ],
    });
    server.use(
      http.post(
        "*/api/v1/courses/:courseId/sections/:sectionId/lessons/reorder",
        () =>
          HttpResponse.json({
            code: 0,
            message: "ok",
            data: [section.lessons[1], section.lessons[0]],
          }),
      ),
    );
    const { result, getDetail } = renderReorderHook([section]);

    act(() => {
      result.current.handleReorderLessons(section, [
        section.lessons[1],
        section.lessons[0],
      ]);
    });

    await waitFor(() =>
      expect(getDetail().outline[0]?.lessons.map((l) => l.stable_id)).toEqual([
        "l2",
        "l1",
      ]),
    );
  });

  it("reorders sub-lessons within a lesson and merges the persisted result", async () => {
    const lesson = {
      id: "l1",
      stable_id: "l1",
      title: "L1",
      summary: "",
      order_index: 0,
      row_version: 1,
      sub_lessons: [
        {
          id: "sl1",
          stable_id: "sl1",
          title: "SL1",
          kind: "TEXT" as const,
          is_preview: false,
          order_index: 0,
          row_version: 1,
        },
        {
          id: "sl2",
          stable_id: "sl2",
          title: "SL2",
          kind: "TEXT" as const,
          is_preview: false,
          order_index: 1,
          row_version: 1,
        },
      ],
    };
    const section = buildSection({
      id: "sec-1",
      stable_id: "s1",
      lessons: [lesson],
    });
    server.use(
      http.post(
        "*/api/v1/courses/:courseId/lessons/:lessonId/sub-lessons/reorder",
        () =>
          HttpResponse.json({
            code: 0,
            message: "ok",
            data: [lesson.sub_lessons[1], lesson.sub_lessons[0]],
          }),
      ),
    );
    const { result, getDetail } = renderReorderHook([section]);

    act(() => {
      result.current.handleReorderSubLessons(lesson, [
        lesson.sub_lessons[1],
        lesson.sub_lessons[0],
      ]);
    });

    await waitFor(() =>
      expect(
        getDetail().outline[0]?.lessons[0]?.sub_lessons.map(
          (sl) => sl.stable_id,
        ),
      ).toEqual(["sl2", "sl1"]),
    );
  });
});
