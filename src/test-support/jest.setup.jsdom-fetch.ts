/**
 * jsdom implements no Fetch API. `undici` needs `TextEncoder`/`TextDecoder`/
 * Web Streams already on `globalThis` when it loads — see
 * `jest.setup.jsdom-encoding.ts`, which must run before this file.
 */
import { FormData, fetch, Headers, Request, Response } from "undici";

Object.assign(globalThis, { fetch, Headers, Request, Response, FormData });
