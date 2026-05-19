import type { GrpcEventsConfig } from "@/config/events/gRPC";
import { joinBaseUrlAndPath } from "@/events/core/join-url";
import { publishRawStreamPayload } from "@/events/core/publish";

/**
 * Đọc NDJSON (một object JSON mỗi dòng) qua GET — gateway tạm cho tới khi có gRPC-Web thật.
 */
export function startGrpcNdjsonTransport(config: GrpcEventsConfig): () => void {
  if (typeof window === "undefined" || !config.baseUrl) {
    return () => {};
  }

  const ac = new AbortController();
  const url = joinBaseUrlAndPath(config.baseUrl, config.streamPath);

  void (async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: ac.signal,
        headers: {
          Accept: "application/x-ndjson, application/json;q=0.9, */*;q=0.8",
        },
        credentials: "include",
      });
      if (!res.ok || !res.body) {
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!ac.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }
          try {
            const raw = JSON.parse(trimmed) as unknown;
            publishRawStreamPayload(raw, "gRPC");
          } catch {
            // skip bad line
          }
        }
      }
    } catch {
      // aborted hoặc lỗi mạng — dừng im lặng
    }
  })();

  return () => {
    ac.abort();
  };
}
