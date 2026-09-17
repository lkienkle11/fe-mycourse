import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en";
import { server } from "@/test-support/msw/server";
import type { CourseCollaborator } from "@/types/course";
import { useCourseCollaboratorActions } from "./use-course-collaborator-actions";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function buildCollaborator(userId: string): CourseCollaborator {
  return {
    user_id: userId,
    role: "EDITOR",
    display_name: `User ${userId}`,
    email: `${userId}@example.com`,
  };
}

describe("useCourseCollaboratorActions", () => {
  it("sends exactly one bulk request with every selected id and role EDITOR, toggling loading state", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(
        "*/api/v1/courses/:courseId/collaborators/bulk",
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            code: 0,
            message: "ok",
            data: {
              added: [buildCollaborator("u1"), buildCollaborator("u2")],
              failed: [],
            },
          });
        },
      ),
    );
    const setIsSubmittingCollaborator = jest.fn();

    const { result } = renderHook(
      () =>
        useCourseCollaboratorActions({
          courseId: "course-1",
          setIsSubmittingCollaborator,
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleAddCollaborators(["u1", "u2"]);
    });

    expect(capturedBody).toEqual({ user_ids: ["u1", "u2"], role: "EDITOR" });
    expect(setIsSubmittingCollaborator).toHaveBeenNthCalledWith(1, true);
    expect(setIsSubmittingCollaborator).toHaveBeenNthCalledWith(2, false);
  });

  it("resets loading state even when the bulk request rejects", async () => {
    server.use(
      http.post("*/api/v1/courses/:courseId/collaborators/bulk", () =>
        HttpResponse.json(
          { code: 500, message: "server error", data: null },
          { status: 500 },
        ),
      ),
    );
    const setIsSubmittingCollaborator = jest.fn();

    const { result } = renderHook(
      () =>
        useCourseCollaboratorActions({
          courseId: "course-1",
          setIsSubmittingCollaborator,
        }),
      { wrapper },
    );

    await act(async () => {
      await expect(
        result.current.handleAddCollaborators(["u1"]),
      ).rejects.toBeDefined();
    });

    await waitFor(() =>
      expect(setIsSubmittingCollaborator).toHaveBeenLastCalledWith(false),
    );
  });

  it("removes a single collaborator by id", async () => {
    let capturedUrl = "";
    server.use(
      http.delete(
        "*/api/v1/courses/:courseId/collaborators/:userId",
        ({ request, params }) => {
          capturedUrl = request.url;
          expect(params.userId).toBe("u3");
          return HttpResponse.json({
            code: 0,
            message: "ok",
            data: [buildCollaborator("u1")],
          });
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useCourseCollaboratorActions({
          courseId: "course-1",
          setIsSubmittingCollaborator: jest.fn(),
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleRemoveCollaborator(buildCollaborator("u3"));
    });

    expect(capturedUrl).toContain("/courses/course-1/collaborators/u3");
  });
});
