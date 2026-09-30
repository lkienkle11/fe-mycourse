import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { renderWithProviders } from "@/test-support/render";
import { ConfirmActionDialog } from "./confirm-action-dialog";

const labels = {
  title: "Slug already exists",
  description: "Continue with the suggested slug?",
  confirmLabel: "Yes",
  cancelLabel: "No",
};

describe("ConfirmActionDialog", () => {
  it("renders an alert dialog and reports cancel and confirm", async () => {
    const onOpenChange = jest.fn<(open: boolean) => void>();
    const onConfirm = jest.fn<() => void>();
    const { user } = renderWithProviders(
      <ConfirmActionDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        {...labels}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stacked: renders inside a parent dialog, keeps it open, and reports cancel and confirm", async () => {
    const onOpenChange = jest.fn<(open: boolean) => void>();
    const onConfirm = jest.fn<() => void>();
    const { user } = renderWithProviders(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <Button type="button">Create</Button>
          <ConfirmActionDialog
            stacked
            open
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            {...labels}
          />
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("Create")).toBeTruthy();
  });

  it("stacked: ignores dismissal while loading", async () => {
    const onOpenChange = jest.fn<(open: boolean) => void>();
    const { user } = renderWithProviders(
      <Dialog open>
        <DialogContent aria-describedby={undefined}>
          <ConfirmActionDialog
            stacked
            open
            isLoading
            loadingLabel="Creating..."
            onOpenChange={onOpenChange}
            onConfirm={jest.fn<() => void>()}
            {...labels}
          />
        </DialogContent>
      </Dialog>,
    );

    expect(
      (screen.getByRole("button", { name: "Creating..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
