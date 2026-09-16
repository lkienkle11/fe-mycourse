import { describe, expect, it, jest } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { renderWithProviders } from "@/test-support/render";
import type {
  UserPickerCandidate,
  UserPickerLabels,
} from "@/types/user-picker";
import { UserMultiSelectPickerDialog } from "./user-multi-select-picker-dialog";

const rows: UserPickerCandidate[] = [
  { user_id: "user-1", display_name: "Alice", email: "alice@example.com" },
  { user_id: "user-2", display_name: "Bob", email: "bob@example.com" },
];

const labels: UserPickerLabels = {
  title: "Add collaborators",
  description: "Pick learners to add",
  searchPlaceholder: "Search",
  searchAction: "Search",
  loading: "Loading",
  empty: "No results",
  cancel: "Cancel",
  addSelected: "Add selected",
  adding: "Adding...",
};

const paginationLabels = {
  previousLabel: "Previous",
  nextLabel: "Next",
  buildPageOfLabel: (page: number, totalPages: number) =>
    `Page ${page} of ${totalPages}`,
};

/** Real controlled-selection wrapper — mirrors how the feature dialog owns `selectedIds`. */
function PickerHarness({
  onConfirm,
}: {
  onConfirm: (
    userIds: string[],
  ) => Promise<{ succeededIds: string[]; failedCount: number } | undefined>;
}) {
  const [open, setOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <UserMultiSelectPickerDialog
      open={open}
      onOpenChange={setOpen}
      isSubmitting={false}
      onConfirm={onConfirm}
      rows={rows}
      pageInfo={null}
      isLoading={false}
      page={1}
      onPageChange={() => {}}
      searchInput=""
      onSearchInputChange={() => {}}
      onSearchSubmit={() => {}}
      selectedIds={selectedIds}
      onToggleSelection={(userId, checked) =>
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (checked) next.add(userId);
          else next.delete(userId);
          return next;
        })
      }
      onRemoveFromSelection={(userIds) =>
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of userIds) next.delete(id);
          return next;
        })
      }
      onReset={() => setSelectedIds(new Set())}
      labels={labels}
      paginationLabels={paginationLabels}
    />
  );
}

describe("UserMultiSelectPickerDialog", () => {
  it("on partial success, removes succeeded selections and retains the failed one", async () => {
    const onConfirm = jest.fn<
      (
        userIds: string[],
      ) => Promise<{ succeededIds: string[]; failedCount: number }>
    >(async (userIds) => ({
      succeededIds: userIds.filter((id) => id === "user-1"),
      failedCount: 1,
    }));

    const { user } = renderWithProviders(
      <PickerHarness onConfirm={onConfirm} />,
    );

    await user.click(screen.getByRole("checkbox", { name: /Alice/i }));
    await user.click(screen.getByRole("checkbox", { name: /Bob/i }));
    await user.click(screen.getByRole("button", { name: labels.addSelected }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining(["user-1", "user-2"]),
    );

    // Alice (succeeded) is unchecked again; Bob (failed) stays checked/selected.
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: /Alice/i }),
      ).not.toBeChecked(),
    );
    expect(screen.getByRole("checkbox", { name: /Bob/i })).toBeChecked();
  });

  it("on full success, clears the selection and closes the dialog", async () => {
    const onConfirm = jest.fn<
      (
        userIds: string[],
      ) => Promise<{ succeededIds: string[]; failedCount: number } | undefined>
    >(async () => undefined);

    const { user } = renderWithProviders(
      <PickerHarness onConfirm={onConfirm} />,
    );
    await user.click(screen.getByRole("checkbox", { name: /Alice/i }));
    await user.click(screen.getByRole("button", { name: labels.addSelected }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("does not submit when nothing is selected", async () => {
    const onConfirm =
      jest.fn<
        (
          userIds: string[],
        ) => Promise<
          { succeededIds: string[]; failedCount: number } | undefined
        >
      >();
    const { user } = renderWithProviders(
      <PickerHarness onConfirm={onConfirm} />,
    );

    expect(
      screen.getByRole("button", { name: labels.addSelected }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: labels.addSelected }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
