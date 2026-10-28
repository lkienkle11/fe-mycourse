import { handleRefreshProxy } from "@/api/auth/refresh-proxy";
import {
  createClearSessionFromRequest,
  createPersistRotatedSessionFromRequest,
  readAuthCookiesFromRequest,
} from "@/api/auth/server-auth";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_BASE_URL;

export async function POST() {
  return handleRefreshProxy({
    readAuthCookies: readAuthCookiesFromRequest,
    persistSession: createPersistRotatedSessionFromRequest(),
    clearSession: createClearSessionFromRequest(),
    baseURL: resolvedBaseURL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}
