import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ApiHttpError } from "@/api/core/fetch-error";
import {
  REMOTE_COMPANIES_URL,
  REMOTE_JOB_TITLES_URL,
} from "@/lib/instructor-application/remote-data";
import messages from "@/messages/en";
import { useMeStore } from "@/store/auth";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { renderWithProviders } from "@/test-support/render";
import BecomeInstructorRoutePage from "./page";

describe("/become-instructor route — sign-in gate", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/v1/media/files", () => okEnvelope([])),
      http.get(REMOTE_JOB_TITLES_URL, () => HttpResponse.json([])),
      http.get(REMOTE_COMPANIES_URL, () => HttpResponse.json([])),
    );
  });

  it("shows the shared unauthorized state with a sign-in link for a guest", () => {
    useMeStore.setState({ me: null, isLoading: false });
    renderWithProviders(<BecomeInstructorRoutePage />);

    expect(
      screen.getByRole("heading", {
        name: messages.instructor.application.stateA.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: messages.instructor.application.stateA.login,
      }),
    ).toHaveAttribute("href", expect.stringContaining("next="));
  });

  it("shows the retryable server-error state instead of the gate when the current user failed to load", () => {
    const mutateMe = jest.fn();
    useMeStore.setState({
      me: null,
      isLoading: false,
      isError: new ApiHttpError({
        message: "HTTP 503",
        response: { status: 503, data: {}, headers: {} },
        request: { url: "/api/v1/me", method: "GET", retried: false },
      }),
      mutateMe,
    });
    renderWithProviders(<BecomeInstructorRoutePage />);

    expect(
      screen.queryByText(messages.instructor.application.stateA.title),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: messages.errors.boundary.retry }),
    );
    expect(mutateMe).toHaveBeenCalledTimes(1);
  });
});
