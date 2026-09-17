/**
 * Loopback HTTP fixture backend for Playwright browser tests.
 *
 * Serves the subset of the real BE contract the Stage 3 browser journeys need
 * (auth, `/me`, course detail/collaborators/candidates, taxonomy lists). Plain
 * `node:http`, no framework — this only needs to exist for the lifetime of one
 * `test:e2e` run. State is in-memory and reset between test files via
 * `POST /__fixtures__/reset`.
 *
 * Only synthetic accounts/tokens. Scoped to loopback by only ever binding to
 * 127.0.0.1 (see `start()`).
 */

import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

/** @type {Map<string, {sessionId: string, userId: string, accessToken: string, refreshToken: string, expired: boolean, revoked: boolean}>} */
let sessionsByAccessToken = new Map();
/** @type {Map<string, ReturnType<typeof sessionsByAccessToken.get>>} */
let sessionsById = new Map();

const USERS = {
  "instructor@example.test": {
    id: "user-instructor",
    password: "Passw0rd!1",
    display_name: "Fixture Instructor",
    permissions: [
      "instructor:modify",
      "course_instructor:read",
      "course:read",
      "course_collaborator_candidate:read",
    ],
    roles: ["instructor"],
  },
  "learner@example.test": {
    id: "user-learner",
    password: "Passw0rd!1",
    display_name: "Fixture Learner",
    permissions: [],
    roles: ["learner"],
  },
};

const CANDIDATE_USER = {
  user_id: "user-candidate",
  display_name: "Candidate Collaborator",
  email: "candidate@example.test",
};

const COURSE_ID = "course-fixture-1";
let collaborators = [
  {
    user_id: "user-instructor",
    role: "OWNER",
    display_name: "Fixture Instructor",
    email: "instructor@example.test",
  },
];

function resetState() {
  sessionsByAccessToken = new Map();
  sessionsById = new Map();
  collaborators = [
    {
      user_id: "user-instructor",
      role: "OWNER",
      display_name: "Fixture Instructor",
      email: "instructor@example.test",
    },
  ];
  outlineSections = buildInitialOutlineSections();
  leasesByToken = new Map();
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { ...JSON_HEADERS, ...extraHeaders });
  res.end(JSON.stringify(body));
}

function envelope(code, message, data) {
  return { code, message, data };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function parseCookies(req) {
  const raw = req.headers.cookie ?? "";
  /** @type {Record<string, string>} */
  const out = {};
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
  }
  return out;
}

function issueSession(userId) {
  const sessionId = randomUUID();
  const accessToken = `access-${randomUUID()}`;
  const refreshToken = `refresh-${randomUUID()}`;
  const session = {
    sessionId,
    userId,
    accessToken,
    refreshToken,
    expired: false,
    revoked: false,
  };
  sessionsByAccessToken.set(accessToken, session);
  sessionsById.set(sessionId, session);
  return session;
}

function rotateSession(session) {
  sessionsByAccessToken.delete(session.accessToken);
  session.accessToken = `access-${randomUUID()}`;
  session.refreshToken = `refresh-${randomUUID()}`;
  sessionsByAccessToken.set(session.accessToken, session);
  return session;
}

function userMeResponse(userId) {
  const entry = Object.entries(USERS).find(([, u]) => u.id === userId);
  if (!entry) return null;
  const [email, user] = entry;
  return {
    user_id: user.id,
    user_code: user.id,
    email,
    display_name: user.display_name,
    avatar_url: "",
    email_confirmed: true,
    is_disabled: false,
    created_at: 1_700_000_000,
    permissions: user.permissions,
    roles: user.roles,
  };
}

/**
 * Two sections so the outline drag-reorder journey has something to
 * reorder. Reordering is driven through `@dnd-kit`'s keyboard sensor in
 * `e2e/tests/course-editing.spec.ts` (Space to pick up, ArrowDown to move,
 * Space to drop) rather than pointer simulation.
 */
function buildInitialOutlineSections() {
  return [
    {
      id: "section-1",
      stable_id: "section-1",
      title: "Alpha Section",
      description: "",
      order_index: 0,
      row_version: 1,
      lessons: [],
    },
    {
      id: "section-2",
      stable_id: "section-2",
      title: "Beta Section",
      description: "",
      order_index: 1,
      row_version: 1,
      lessons: [],
    },
  ];
}

let outlineSections = buildInitialOutlineSections();

/** @type {Map<string, {id: string, course_id: string, course_version_id: string, resource_type: string, resource_stable_id: string, holder_user_id: string, lease_token: string, expires_at: number, created_at: number, updated_at: number}>} */
let leasesByToken = new Map();

function buildCourseDetail() {
  return {
    course: {
      id: COURSE_ID,
      owner_user_id: "user-instructor",
      slug: "fixture-course",
      created_at: 1_700_000_000,
      updated_at: 1_700_000_000,
    },
    collaborator_role: "OWNER",
    draft_version: {
      id: "version-1",
      course_id: COURSE_ID,
      version_no: 1,
      status: "DRAFT",
      title: "Fixture Course",
      short_description: "A synthetic course used by Playwright journeys.",
      about_course: "",
      tag_ids: [],
      skill_ids: [],
      outcome_ids: [],
      row_version: 1,
      rejection_reason: "",
      created_at: 1_700_000_000,
      updated_at: 1_700_000_000,
    },
    collaborators,
    outline: outlineSections,
  };
}

function emptyPaginated(result = []) {
  return {
    result,
    page_info: {
      page: 1,
      per_page: 20,
      total_pages: 1,
      total_items: result.length,
    },
  };
}

/** @param {import("node:http").IncomingMessage} req */
function authFromCookie(req) {
  const cookies = parseCookies(req);
  const accessToken = cookies.access_token;
  if (!accessToken) return null;
  return sessionsByAccessToken.get(accessToken) ?? null;
}

/**
 * The browser transport calls this backend cross-origin (Next app on one
 * port, fixture backend on another) with `credentials: "include"`. That
 * requires an explicit (non-wildcard) `Access-Control-Allow-Origin` plus
 * `Access-Control-Allow-Credentials`, and a handled `OPTIONS` preflight —
 * otherwise the browser silently discards every response before JS sees it.
 */
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader(
    "access-control-allow-headers",
    "content-type, x-refresh-token, x-session-id",
  );
  res.setHeader(
    "access-control-allow-methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
}

async function handle(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://fixture.local");
  const pathname = url.pathname;
  const method = req.method ?? "GET";

  try {
    if (method === "POST" && pathname === "/__fixtures__/reset") {
      resetState();
      return json(res, 200, { ok: true });
    }

    if (method === "POST" && pathname === "/__fixtures__/revoke-session") {
      const body = (await readBody(req)) ?? {};
      const session = sessionsById.get(body.session_id);
      if (session) session.revoked = true;
      return json(res, 200, { ok: true });
    }

    if (method === "POST" && pathname === "/api/v1/auth/login") {
      const body = (await readBody(req)) ?? {};
      const user = USERS[body.email];
      if (!user || user.password !== body.password) {
        return json(
          res,
          401,
          envelope(3002, "Invalid email or password", null),
        );
      }
      const session = issueSession(user.id);
      return json(
        res,
        200,
        envelope(0, "Login successful", {
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          session_id: session.sessionId,
        }),
        { "set-cookie": "refresh_token=fixture; Max-Age=1209600; Path=/" },
      );
    }

    if (method === "GET" && pathname === "/api/v1/me") {
      const session = authFromCookie(req);
      if (!session || session.revoked) {
        return json(res, 401, envelope(3002, "Unauthorized", null));
      }
      if (session.expired) {
        return json(res, 401, envelope(3002, "Token expired", null), {
          "x-token-expired": "true",
        });
      }
      return json(res, 200, envelope(0, "ok", userMeResponse(session.userId)));
    }

    if (method === "POST" && pathname === "/api/v1/auth/refresh") {
      const refreshToken = req.headers["x-refresh-token"];
      const sessionId = req.headers["x-session-id"];
      const session = sessionId
        ? sessionsById.get(String(sessionId))
        : undefined;
      if (
        !session ||
        session.revoked ||
        session.refreshToken !== refreshToken
      ) {
        return json(
          res,
          401,
          envelope(3002, "Refresh session unauthorized", null),
        );
      }
      rotateSession(session);
      return json(
        res,
        200,
        envelope(0, "ok", {
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          session_id: session.sessionId,
        }),
        { "set-cookie": "refresh_token=fixture; Max-Age=1209600; Path=/" },
      );
    }

    if (method === "POST" && pathname === "/api/v1/auth/logout") {
      const sessionId = req.headers["x-session-id"];
      const session = sessionId
        ? sessionsById.get(String(sessionId))
        : undefined;
      if (session) {
        sessionsByAccessToken.delete(session.accessToken);
        sessionsById.delete(session.sessionId);
      }
      return json(res, 200, envelope(0, "ok", null));
    }

    if (method === "GET" && pathname === `/api/v1/courses/${COURSE_ID}`) {
      return json(res, 200, envelope(0, "ok", buildCourseDetail()));
    }

    if (
      method === "GET" &&
      pathname === `/api/v1/courses/${COURSE_ID}/collaborators`
    ) {
      return json(res, 200, envelope(0, "ok", emptyPaginated(collaborators)));
    }

    if (
      method === "GET" &&
      pathname === `/api/v1/courses/${COURSE_ID}/instructor-candidates`
    ) {
      return json(
        res,
        200,
        envelope(0, "ok", emptyPaginated([CANDIDATE_USER])),
      );
    }

    if (
      method === "POST" &&
      pathname === `/api/v1/courses/${COURSE_ID}/collaborators/bulk`
    ) {
      const body = (await readBody(req)) ?? {};
      const added = (body.user_ids ?? [])
        .filter((id) => id === CANDIDATE_USER.user_id)
        .map((id) => ({
          user_id: id,
          role: body.role ?? "EDITOR",
          ...CANDIDATE_USER,
        }));
      for (const row of added) {
        if (!collaborators.some((c) => c.user_id === row.user_id)) {
          collaborators.push(row);
        }
      }
      const failed = (body.user_ids ?? [])
        .filter((id) => id !== CANDIDATE_USER.user_id)
        .map((id) => ({ user_id: id, message: "Unknown user" }));
      return json(res, 200, envelope(0, "ok", { added, failed }));
    }

    if (
      method === "POST" &&
      pathname === `/api/v1/courses/${COURSE_ID}/sections/reorder`
    ) {
      const body = (await readBody(req)) ?? {};
      const orderedIds = body.ordered_stable_ids ?? [];
      outlineSections = orderedIds
        .map((stableId, index) => {
          const section = outlineSections.find(
            (item) => item.stable_id === stableId,
          );
          return section ? { ...section, order_index: index } : null;
        })
        .filter((section) => section != null);
      return json(res, 200, envelope(0, "ok", outlineSections));
    }

    if (
      method === "POST" &&
      pathname === `/api/v1/courses/${COURSE_ID}/leases/acquire`
    ) {
      const body = (await readBody(req)) ?? {};
      const session = authFromCookie(req);
      if (!session) {
        return json(res, 401, envelope(3002, "Unauthorized", null));
      }
      const now = Date.now();
      const lease = {
        id: `lease-${randomUUID()}`,
        course_id: COURSE_ID,
        course_version_id: body.course_version_id ?? "version-1",
        resource_type: body.resource_type ?? "OUTLINE_ROOT",
        resource_stable_id: body.resource_stable_id ?? "",
        holder_user_id: session.userId,
        lease_token: `lease-token-${randomUUID()}`,
        expires_at: now + 120_000,
        created_at: now,
        updated_at: now,
      };
      leasesByToken.set(lease.lease_token, lease);
      return json(res, 200, envelope(0, "ok", lease));
    }

    if (
      method === "POST" &&
      pathname === `/api/v1/courses/${COURSE_ID}/leases/heartbeat`
    ) {
      const body = (await readBody(req)) ?? {};
      const lease = leasesByToken.get(body.lease_token);
      if (!lease) {
        return json(res, 404, envelope(4004, "Lease not found", null));
      }
      lease.updated_at = Date.now();
      lease.expires_at = lease.updated_at + 120_000;
      return json(res, 200, envelope(0, "ok", lease));
    }

    if (
      method === "POST" &&
      pathname === `/api/v1/courses/${COURSE_ID}/leases/release`
    ) {
      const body = (await readBody(req)) ?? {};
      leasesByToken.delete(body.lease_token);
      return json(res, 200, envelope(0, "ok", null));
    }

    if (method === "GET" && pathname.startsWith("/api/v1/taxonomy/")) {
      return json(res, 200, envelope(0, "ok", emptyPaginated([])));
    }

    if (method === "GET" && pathname === "/api/v1/courses/my") {
      return json(res, 200, envelope(0, "ok", []));
    }

    return json(res, 404, envelope(4004, "Not found", null));
  } catch (error) {
    json(res, 500, envelope(5000, "Fixture backend error", null));
    console.error("[fixture-backend]", error);
  }
}

export function start(port) {
  const server = createServer((req, res) => {
    void handle(req, res);
  });
  return new Promise((resolve) => {
    server.listen(port, "localhost", () => resolve(server));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.FIXTURE_PORT ?? 4100);
  await start(port);
  console.log(`[fixture-backend] listening on http://localhost:${port}`);
}
