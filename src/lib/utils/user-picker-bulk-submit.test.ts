import { describe, expect, it, jest } from "@jest/globals";
import { finalizeBulkUserPickerSubmit } from "./user-picker-bulk-submit";

type Added = { user_id: string };

function buildToasts() {
  return {
    onSuccess: jest.fn(),
    onAllFailed: jest.fn(),
    onPartialSuccess: jest.fn(),
    onApiError: jest.fn(),
  };
}

describe("finalizeBulkUserPickerSubmit", () => {
  it("does nothing and never calls submit for an empty selection", async () => {
    const submit =
      jest.fn<
        (userIds: string[]) => Promise<{ added: Added[]; failed: unknown[] }>
      >();
    const toasts = buildToasts();

    const result = await finalizeBulkUserPickerSubmit({
      userIds: [],
      submit,
      mapSucceededIds: (added: Added[]) => added.map((a) => a.user_id),
      toasts,
    });

    expect(result).toBeUndefined();
    expect(submit).not.toHaveBeenCalled();
    expect(toasts.onSuccess).not.toHaveBeenCalled();
  });

  it("on full success, calls afterSubmit, fires onSuccess, and returns undefined", async () => {
    const submit = jest.fn(async (ids: string[]) => ({
      added: ids.map((id) => ({ user_id: id })),
      failed: [],
    }));
    const afterSubmit = jest.fn(async () => {});
    const toasts = buildToasts();

    const result = await finalizeBulkUserPickerSubmit({
      userIds: ["u1", "u2"],
      submit,
      mapSucceededIds: (added: Added[]) => added.map((a) => a.user_id),
      toasts,
      afterSubmit,
    });

    expect(result).toBeUndefined();
    expect(toasts.onSuccess).toHaveBeenCalledTimes(1);
    expect(afterSubmit).toHaveBeenCalledTimes(1);
    expect(toasts.onPartialSuccess).not.toHaveBeenCalled();
  });

  it("on partial success, returns succeeded ids and failed count, and warns", async () => {
    const submit = jest.fn(async () => ({
      added: [{ user_id: "u1" }],
      failed: [{ reason: "denied" }],
    }));
    const afterSubmit = jest.fn(async () => {});
    const toasts = buildToasts();

    const result = await finalizeBulkUserPickerSubmit({
      userIds: ["u1", "u2"],
      submit,
      mapSucceededIds: (added: Added[]) => added.map((a) => a.user_id),
      toasts,
      afterSubmit,
    });

    expect(result).toEqual({ succeededIds: ["u1"], failedCount: 1 });
    expect(toasts.onPartialSuccess).toHaveBeenCalledWith(1, 1);
    expect(afterSubmit).toHaveBeenCalledTimes(1);
  });

  it("when every pick fails, throws a sentinel error without an API-error toast", async () => {
    const submit = jest.fn(async () => ({
      added: [],
      failed: [{ reason: "denied" }, { reason: "denied" }],
    }));
    const toasts = buildToasts();

    await expect(
      finalizeBulkUserPickerSubmit({
        userIds: ["u1", "u2"],
        submit,
        mapSucceededIds: (added: Added[]) => added.map((a) => a.user_id),
        toasts,
      }),
    ).rejects.toThrow("bulk user picker add all failed");

    expect(toasts.onAllFailed).toHaveBeenCalledTimes(1);
    expect(toasts.onApiError).not.toHaveBeenCalled();
  });

  it("rethrows and reports a real submit failure via onApiError, never onAllFailed", async () => {
    const apiError = new Error("network down");
    const submit = jest.fn(async () => {
      throw apiError;
    });
    const toasts = buildToasts();

    await expect(
      finalizeBulkUserPickerSubmit({
        userIds: ["u1"],
        submit,
        mapSucceededIds: (added: Added[]) => added.map((a) => a.user_id),
        toasts,
      }),
    ).rejects.toBe(apiError);

    expect(toasts.onApiError).toHaveBeenCalledWith(apiError);
    expect(toasts.onAllFailed).not.toHaveBeenCalled();
  });
});
