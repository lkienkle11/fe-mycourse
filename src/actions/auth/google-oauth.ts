"use server";

import { createWritableServerApiMethods } from "@/api/auth/server-auth";
import { createAuthCallers } from "@/api/callers/auth/auth-factory";
import { finalizeAuthLoginAction } from "@/lib/utils/auth-action";
import type { AuthActionResult } from "@/types/auth/auth";

export async function googleLoginAction(payload: {
  code: string;
  remember_me: boolean;
}): Promise<AuthActionResult> {
  const auth = createAuthCallers(await createWritableServerApiMethods());
  return finalizeAuthLoginAction(() => auth.googleLoginService(payload));
}

export async function googleOneTapAction(payload: {
  credential: string;
}): Promise<AuthActionResult> {
  const auth = createAuthCallers(await createWritableServerApiMethods());
  return finalizeAuthLoginAction(() => auth.googleOneTapService(payload));
}
