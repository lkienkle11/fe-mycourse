import { describe, expect, it, jest } from "@jest/globals";
import type { ApiMethods } from "@/api/core/methods";
import type { MediaFile } from "@/types/media";
import { createMediaCallers } from "./media-factory";

function buildMediaFile(overrides: Partial<MediaFile> = {}): MediaFile {
  return {
    id: "file-1",
    object_key: "key-1",
    file_name: "photo.png",
    content_type: "image/png",
    size_bytes: 1024,
    visibility: "private",
    url: "https://cdn.example.com/key-1",
    created_at: 1_700_000_000,
    ...overrides,
  } as MediaFile;
}

function buildFakeMethods(overrides: Partial<ApiMethods> = {}): ApiMethods {
  return {
    apiFetch: jest.fn(),
    apiPost: jest.fn(),
    apiPut: jest.fn(),
    apiPatch: jest.fn(),
    apiDelete: jest.fn(),
    apiOptions: jest.fn(),
    ...overrides,
  } as ApiMethods;
}

describe("createMediaCallers — uploadMediaFiles", () => {
  it("sends every file plus the default visibility as multipart form fields", async () => {
    let capturedBody: FormData | undefined;
    const apiPost = jest.fn(async (_url: string, body: unknown) => {
      capturedBody = body as FormData;
      return { data: { data: [buildMediaFile()] } };
    });
    const { uploadMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiPost: apiPost as never }),
    );

    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    await uploadMediaFiles([fileA, fileB]);

    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody?.getAll("files")).toEqual([fileA, fileB]);
    expect(capturedBody?.get("visibility")).toBe("private");
  });

  it("sends an explicit visibility when provided", async () => {
    let capturedBody: FormData | undefined;
    const apiPost = jest.fn(async (_url: string, body: unknown) => {
      capturedBody = body as FormData;
      return { data: { data: [buildMediaFile({ visibility: "public" })] } };
    });
    const { uploadMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiPost: apiPost as never }),
    );

    await uploadMediaFiles([new File(["a"], "a.png")], {
      visibility: "public",
    });

    expect(capturedBody?.get("visibility")).toBe("public");
  });

  it("returns the uploaded files on an accepted response", async () => {
    const uploaded = [buildMediaFile({ id: "file-9" })];
    const apiPost = jest.fn(async () => ({ data: { data: uploaded } }));
    const { uploadMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiPost: apiPost as never }),
    );

    const result = await uploadMediaFiles([new File(["a"], "a.png")]);

    expect(result).toBe(uploaded);
  });

  it("propagates a transport error instead of an upload service without a real upload backend", async () => {
    const transportError = new Error("network down");
    const apiPost = jest.fn(async () => {
      throw transportError;
    });
    const { uploadMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiPost: apiPost as never }),
    );

    await expect(uploadMediaFiles([new File(["a"], "a.png")])).rejects.toBe(
      transportError,
    );
  });

  it("throws when the accepted response carries no data payload", async () => {
    const apiPost = jest.fn(async () => ({
      data: { data: null, message: "Upload rejected" },
    }));
    const { uploadMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiPost: apiPost as never }),
    );

    await expect(uploadMediaFiles([new File(["a"], "a.png")])).rejects.toThrow(
      "Upload rejected",
    );
  });
});

describe("createMediaCallers — listMediaFiles / deleteMediaFile", () => {
  it("lists files through apiFetch and returns the paginated payload", async () => {
    const page = {
      result: [buildMediaFile()],
      page_info: { page: 1, per_page: 20, total_pages: 1, total_items: 1 },
    };
    const apiFetch = jest.fn(async () => ({ data: { data: page } }));
    const { listMediaFiles } = createMediaCallers(
      buildFakeMethods({ apiFetch: apiFetch as never }),
    );

    const result = await listMediaFiles({});

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(result).toBe(page);
  });

  it("deletes by object key through apiDelete", async () => {
    const apiDelete = jest.fn<
      (url: string) => Promise<{ data: { data: null } }>
    >(async () => ({ data: { data: null } }));
    const { deleteMediaFile } = createMediaCallers(
      buildFakeMethods({ apiDelete: apiDelete as never }),
    );

    await deleteMediaFile("key-1");

    expect(apiDelete).toHaveBeenCalledTimes(1);
    expect(apiDelete.mock.calls[0]?.[0]).toContain("key-1");
  });
});
