import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "./user-avatar";

describe("UserAvatar", () => {
  it("renders the picture with a default alternative text", () => {
    render(<UserAvatar name="Ada Lovelace" src="/pic.png" size={40} />);
    expect(
      screen.getByRole("img", { name: "Ada Lovelace avatar" }),
    ).toBeInTheDocument();
  });

  it("uses a custom alternative text, including an empty decorative one", () => {
    const { container } = render(
      <UserAvatar name="Ada" src="/pic.png" alt="" size={40} />,
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("falls back to the initials of two words when there is no picture", () => {
    render(<UserAvatar name="Ada Lovelace" size={40} />);
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to the first two letters of a single word", () => {
    render(<UserAvatar name="Nguyễn" src="" size={40} />);
    expect(screen.getByText("NG")).toBeInTheDocument();
  });

  it("shows the neutral initial for an empty name", () => {
    render(<UserAvatar name="  " size={40} />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });
});
