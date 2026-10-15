import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import { ApiHttpError } from "@/api/core/fetch-error";
import enMessages from "@/messages/en";
import { useSlugConflictFlow } from "./use-slug-conflict-flow";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function httpError(status: number, data: unknown) {
  return new ApiHttpError({
    message: "http error",
    response: { status, data, headers: {} },
    request: { url: "/x", method: "POST", retried: false },
  });
}

function conflict(recommended: string) {
  return httpError(409, {
    code: 3007,
    message: "Slug already exists",
    data: { recommended_slug: recommended },
  });
}

type Payload = { slug: string };

function setup(options: {
  slug?: string;
  request: (payload: Payload) => Promise<string>;
  prepare?: (slug: string) => Payload | null;
}) {
  const setSlug = jest.fn<(slug: string) => void>();
  const onSuccess = jest.fn<(result: string) => void>();
  const prepare =
    options.prepare ?? ((nextSlug: string): Payload => ({ slug: nextSlug }));
  const hook = renderHook(
    () =>
      useSlugConflictFlow<Payload, string>({
        slug: options.slug ?? "typed",
        setSlug,
        prepare,
        request: options.request,
        onSuccess,
      }),
    { wrapper },
  );
  return { ...hook, setSlug, onSuccess };
}

describe("useSlugConflictFlow", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("skips the request and clears the suggestion when prepare returns null", async () => {
    const request = jest.fn<(payload: Payload) => Promise<string>>();
    const { result, onSuccess } = setup({ request, prepare: () => null });

    await act(async () => {
      await result.current.submit();
    });

    expect(request).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.suggestedSlug).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("sends the current slug and calls onSuccess with the result", async () => {
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockResolvedValue("created");
    const { result, onSuccess } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });

    expect(request).toHaveBeenCalledWith({ slug: "typed" });
    expect(onSuccess).toHaveBeenCalledWith("created");
    expect(result.current.suggestedSlug).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("exposes the recommended slug on a 3007 conflict without onSuccess", async () => {
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockRejectedValue(conflict("typed-x7k92ab"));
    const errorToast = jest.spyOn(toast, "error");
    const { result, onSuccess } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.suggestedSlug).toBe("typed-x7k92ab");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("accept writes the slug back and resubmits with the recommendation", async () => {
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockRejectedValueOnce(conflict("typed-x7k92ab"))
      .mockResolvedValueOnce("created");
    const { result, setSlug, onSuccess } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });
    await act(async () => {
      await result.current.acceptSuggestion();
    });

    expect(setSlug).toHaveBeenCalledWith("typed-x7k92ab");
    expect(request).toHaveBeenLastCalledWith({ slug: "typed-x7k92ab" });
    expect(onSuccess).toHaveBeenCalledWith("created");
    expect(result.current.suggestedSlug).toBeNull();
  });

  it("replaces the suggestion when the resubmission conflicts again", async () => {
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockRejectedValueOnce(conflict("typed-aaaaaaa"))
      .mockRejectedValueOnce(conflict("typed-bbbbbbb"));
    const { result } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });
    await act(async () => {
      await result.current.acceptSuggestion();
    });

    expect(result.current.suggestedSlug).toBe("typed-bbbbbbb");
  });

  it("dismiss clears the suggestion without sending a request", async () => {
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockRejectedValue(conflict("typed-x7k92ab"));
    const { result } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });
    act(() => result.current.dismissSuggestion());

    expect(result.current.suggestedSlug).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("accept is a no-op without a suggestion", async () => {
    const request = jest.fn<(payload: Payload) => Promise<string>>();
    const { result, setSlug } = setup({ request });

    await act(async () => {
      await result.current.acceptSuggestion();
    });

    expect(setSlug).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it("clears the suggestion and shows an error toast for another error", async () => {
    const errorToast = jest
      .spyOn(toast, "error")
      .mockImplementation(() => "id");
    const request = jest
      .fn<(payload: Payload) => Promise<string>>()
      .mockRejectedValue(httpError(500, { code: 9999, message: "boom" }));
    const { result, onSuccess } = setup({ request });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.suggestedSlug).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledTimes(1);
  });
});
