import type { UserPickerConfirmResult } from "@/types/user-picker";

/** Sentinel error when every pick failed; suppresses duplicate API error toast. */
const bulkUserPickerAllFailed = "bulk user picker add all failed";

export type BulkUserPickerSubmitToasts = {
  onSuccess: () => void;
  onAllFailed: () => void;
  onPartialSuccess: (succeededCount: number, failedCount: number) => void;
  onApiError: (error: unknown) => void;
};

type BulkUserPickerSubmitResultShape<TAdded> = {
  added: TAdded[];
  failed: unknown[];
};

type FinalizeBulkUserPickerSubmitParams<TAdded> = {
  userIds: string[];
  submit: (
    userIds: string[],
  ) => Promise<BulkUserPickerSubmitResultShape<TAdded>>;
  mapSucceededIds: (added: TAdded[]) => string[];
  toasts: BulkUserPickerSubmitToasts;
  afterSubmit?: () => Promise<void>;
};

/** Shared partial-success flow for bulk user-picker confirm handlers. */
export async function finalizeBulkUserPickerSubmit<TAdded>({
  userIds,
  submit,
  mapSucceededIds,
  toasts,
  afterSubmit,
}: FinalizeBulkUserPickerSubmitParams<TAdded>): Promise<
  UserPickerConfirmResult | undefined
> {
  if (userIds.length === 0) {
    return undefined;
  }

  try {
    const result = await submit(userIds);

    const succeededCount = result.added.length;
    const failedCount = result.failed.length;

    if (failedCount === 0) {
      if (succeededCount > 0) {
        await afterSubmit?.();
      }
      toasts.onSuccess();
      return undefined;
    }

    if (succeededCount === 0) {
      toasts.onAllFailed();
      throw new Error(bulkUserPickerAllFailed);
    }

    await afterSubmit?.();
    toasts.onPartialSuccess(succeededCount, failedCount);
    return {
      succeededIds: mapSucceededIds(result.added),
      failedCount,
    };
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== bulkUserPickerAllFailed
    ) {
      toasts.onApiError(error);
    }
    throw error;
  }
}
