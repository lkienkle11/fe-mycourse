import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-support/render";
import { useOAuthPostAuth } from "./use-oauth-post-auth";

function Harness({
  nextPath,
  onAuthenticated,
}: {
  nextPath: string | null;
  onAuthenticated: (destination: string) => void;
}) {
  const afterOAuth = useOAuthPostAuth(nextPath, onAuthenticated);
  return (
    <button type="button" onClick={afterOAuth}>
      done
    </button>
  );
}

describe("useOAuthPostAuth", () => {
  it("falls back to the signed-in home when no next path exists", () => {
    const onAuthenticated = jest.fn();
    renderWithProviders(
      <Harness nextPath={null} onAuthenticated={onAuthenticated} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "done" }));

    expect(onAuthenticated).toHaveBeenCalledWith("/home");
  });

  it("sends the public homepage as next straight to the signed-in home", () => {
    const onAuthenticated = jest.fn();
    renderWithProviders(
      <Harness nextPath="/" onAuthenticated={onAuthenticated} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "done" }));

    expect(onAuthenticated).toHaveBeenCalledWith("/home");
  });

  it("honours a validated next path", () => {
    const onAuthenticated = jest.fn();
    renderWithProviders(
      <Harness nextPath="/instructor" onAuthenticated={onAuthenticated} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "done" }));

    expect(onAuthenticated).toHaveBeenCalledWith("/instructor");
  });
});
