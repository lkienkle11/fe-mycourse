import { HttpResponse } from "msw";

/** Success envelope (`{ code: 0, message: "ok", data }`) as the backend returns it. */
export function okEnvelope<T>(data: T) {
  return HttpResponse.json({ code: 0, message: "ok", data });
}
