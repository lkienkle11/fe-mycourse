import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en";
import { server } from "@/test-support/msw/server";
import type { CourseDetail } from "@/types/course";
import { useCourseCreateFlow } from "./use-course-create-flow";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function buildDetail(slug: string): CourseDetail {
  return {
    course: {
      id: "course-1",
      owner_user_id: "user-1",
      slug,
      created_at: 1,
      updated_at: 1,
    },
    collaborator_role: "OWNER",
    collaborators: [],
    outline: [],
  };
}

function conflictResponse(recommendedSlug: string) {
  return HttpResponse.json(
    {
      code: 3007,
      message: "Slug already exists",
      data: { recommended_slug: recommendedSlug },
    },
    { status: 409 },
  );
}

function captureCreateBodies(
  respond: (body: { title: string; slug?: string }) => Response,
) {
  const bodies: Array<{ title: string; slug?: string }> = [];
  server.use(
    http.post("*/api/v1/courses", async ({ request }) => {
      const body = (await request.json()) as { title: string; slug?: string };
      bodies.push(body);
      return respond(body);
    }),
  );
  return bodies;
}

function createdResponse(body: { slug?: string }) {
  return HttpResponse.json({
    code: 0,
    message: "ok",
    data: buildDetail(body.slug ?? "generated-slug"),
  });
}

describe("useCourseCreateFlow", () => {
  it("omits a blank slug and calls onCreated with the created course", async () => {
    const bodies = captureCreateBodies(createdResponse);
    const onCreated = jest.fn<(created: CourseDetail) => void>();
    const { result } = renderHook(() => useCourseCreateFlow({ onCreated }), {
      wrapper,
    });

    act(() => result.current.setTitle("Golang course"));
    await act(async () => {
      await result.current.submit();
    });

    expect(bodies).toEqual([{ title: "Golang course" }]);
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(result.current.title).toBe("");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("sends a manual slug", async () => {
    const bodies = captureCreateBodies(createdResponse);
    const { result } = renderHook(
      () =>
        useCourseCreateFlow({
          onCreated: jest.fn<(created: CourseDetail) => void>(),
        }),
      { wrapper },
    );

    act(() => {
      result.current.setTitle("Golang course");
      result.current.setSlug("golang-course");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(bodies).toEqual([{ title: "Golang course", slug: "golang-course" }]);
  });

  it("exposes the recommended slug on a 3007 conflict and does not call onCreated", async () => {
    captureCreateBodies(() => conflictResponse("golang-course-x7k92ab"));
    const onCreated = jest.fn<(created: CourseDetail) => void>();
    const { result } = renderHook(() => useCourseCreateFlow({ onCreated }), {
      wrapper,
    });

    act(() => {
      result.current.setTitle("Golang course");
      result.current.setSlug("golang-course");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.suggestedSlug).toBe("golang-course-x7k92ab");
    expect(result.current.slug).toBe("golang-course");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("resubmits with the recommended slug when the suggestion is accepted", async () => {
    const bodies = captureCreateBodies((body) =>
      body.slug === "golang-course"
        ? conflictResponse("golang-course-x7k92ab")
        : createdResponse(body),
    );
    const onCreated = jest.fn<(created: CourseDetail) => void>();
    const { result } = renderHook(() => useCourseCreateFlow({ onCreated }), {
      wrapper,
    });

    act(() => {
      result.current.setTitle("Golang course");
      result.current.setSlug("golang-course");
    });
    await act(async () => {
      await result.current.submit();
    });
    await act(async () => {
      await result.current.acceptSuggestion();
    });

    expect(bodies).toEqual([
      { title: "Golang course", slug: "golang-course" },
      { title: "Golang course", slug: "golang-course-x7k92ab" },
    ]);
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(result.current.suggestedSlug).toBeNull();
  });

  it("keeps the form and sends nothing when the suggestion is dismissed", async () => {
    const bodies = captureCreateBodies(() => conflictResponse("recommended-1"));
    const { result } = renderHook(
      () =>
        useCourseCreateFlow({
          onCreated: jest.fn<(created: CourseDetail) => void>(),
        }),
      { wrapper },
    );

    act(() => {
      result.current.setTitle("Golang course");
      result.current.setSlug("golang-course");
    });
    await act(async () => {
      await result.current.submit();
    });
    act(() => result.current.dismissSuggestion());

    expect(result.current.suggestedSlug).toBeNull();
    expect(result.current.title).toBe("Golang course");
    expect(result.current.slug).toBe("golang-course");
    expect(bodies).toHaveLength(1);
  });

  it("replaces the suggestion when the resubmission conflicts again", async () => {
    let attempt = 0;
    captureCreateBodies(() => {
      attempt += 1;
      return conflictResponse(`recommended-${attempt}`);
    });
    const { result } = renderHook(
      () =>
        useCourseCreateFlow({
          onCreated: jest.fn<(created: CourseDetail) => void>(),
        }),
      { wrapper },
    );

    act(() => result.current.setTitle("Golang course"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.suggestedSlug).toBe("recommended-1");

    await act(async () => {
      await result.current.acceptSuggestion();
    });
    expect(result.current.suggestedSlug).toBe("recommended-2");
  });

  it("clears the suggestion and does not call onCreated on other errors", async () => {
    captureCreateBodies(() =>
      HttpResponse.json(
        { code: 3003, message: "forbidden", data: null },
        { status: 403 },
      ),
    );
    const onCreated = jest.fn<(created: CourseDetail) => void>();
    const { result } = renderHook(() => useCourseCreateFlow({ onCreated }), {
      wrapper,
    });

    act(() => result.current.setTitle("Golang course"));
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.suggestedSlug).toBeNull();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("blocks an invalid slug before sending a request", async () => {
    const bodies = captureCreateBodies(createdResponse);
    const { result } = renderHook(
      () =>
        useCourseCreateFlow({
          onCreated: jest.fn<(created: CourseDetail) => void>(),
        }),
      { wrapper },
    );

    act(() => {
      result.current.setTitle("Golang course");
      result.current.setSlug("-golang");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(bodies).toHaveLength(0);
  });
});
