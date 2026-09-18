import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import GlobalError from "./global-error";

/**
 * React resolves `<html>`/`<body>` as "singleton" host elements — they
 * attach to jsdom's real `document.documentElement`/`document.body` instead
 * of nesting inside the test container, so assertions on the rendered
 * `lang` attribute read `document.documentElement` directly.
 */
function renderAt(pathname: string, reset: () => void) {
  window.history.pushState({}, "", pathname);
  render(<GlobalError error={new Error("fatal")} reset={reset} />);
}

describe("global-error.tsx boundary", () => {
  it("defaults to the app's default locale (vi), retries, and links home", () => {
    const reset = jest.fn();
    renderAt("/", reset);

    expect(
      screen.getByRole("heading", { name: "Ối, đã có lỗi xảy ra" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Đã có lỗi ngoài dự kiến xảy ra từ phía chúng tôi. Bạn có thể thử lại, hoặc quay về trang chủ.",
      ),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "vi");

    screen.getByRole("button", { name: "Thử lại" }).click();
    expect(reset).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("link", { name: "Quay về trang chủ" }),
    ).toHaveAttribute("href", "/vi");
  });

  it("renders English copy and an /en home link when the URL was on an /en/ path", () => {
    renderAt("/en/instructor/courses/course-1", jest.fn());

    expect(
      screen.getByRole("heading", { name: "Oops, something went wrong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Something unexpected happened on our end. You can try again, or head back to the homepage.",
      ),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(
      screen.getByRole("link", { name: "Back to homepage" }),
    ).toHaveAttribute("href", "/en");
  });

  it("falls back to the default locale for an unrecognized path segment", () => {
    renderAt("/xx/whatever", jest.fn());

    expect(
      screen.getByRole("heading", { name: "Ối, đã có lỗi xảy ra" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "vi");
  });
});
