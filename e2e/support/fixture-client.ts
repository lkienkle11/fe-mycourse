const FIXTURE_URL = process.env.E2E_FIXTURE_URL ?? "http://localhost:4100";

export async function resetFixtures(): Promise<void> {
  await fetch(`${FIXTURE_URL}/__fixtures__/reset`, { method: "POST" });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await fetch(`${FIXTURE_URL}/__fixtures__/revoke-session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export const FIXTURE_USERS = {
  instructor: { email: "instructor@example.test", password: "Passw0rd!1" },
  learner: { email: "learner@example.test", password: "Passw0rd!1" },
} as const;
