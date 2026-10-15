import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { renderWithProviders } from "@/test-support/render";
import { SlugConflictConfirmDialog } from "./slug-conflict-confirm-dialog";

const labels = {
  title: "Slug already exists",
  description: "We suggest: golang-x7k92ab",
  confirm: "Yes",
  cancel: "No",
  loading: "Creating...",
};

function renderDialog(
  props: Partial<React.ComponentProps<typeof SlugConflictConfirmDialog>>,
) {
  const onAccept = jest.fn<() => void>();
  const onDismiss = jest.fn<() => void>();
  const view = renderWithProviders(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <SlugConflictConfirmDialog
          suggestedSlug="golang-x7k92ab"
          isSubmitting={false}
          onAccept={onAccept}
          onDismiss={onDismiss}
          labels={labels}
          {...props}
        />
      </DialogContent>
    </Dialog>,
  );
  return { ...view, onAccept, onDismiss };
}

describe("SlugConflictConfirmDialog", () => {
  it("is closed while there is no suggested slug", () => {
    renderDialog({ suggestedSlug: null });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("shows the labels and reports accept and dismiss", async () => {
    const { user, onAccept, onDismiss } = renderDialog({});

    expect(screen.getByText("Slug already exists")).toBeTruthy();
    expect(screen.getByText("We suggest: golang-x7k92ab")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onAccept).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows the loading label and disables the buttons while submitting", () => {
    renderDialog({ isSubmitting: true });

    const confirm = screen.getByRole("button", { name: "Creating..." });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "No" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
