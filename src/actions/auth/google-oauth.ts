"use server";

import { googleLoginService, googleOneTapService } from "@/api/callers/auth";
import { finalizeAuthLoginAction } from "@/lib/utils/auth-action";
import type { AuthActionResult } from "@/types/auth/auth";

export async function googleLoginAction(payload: {
  code: string;
  remember_me: boolean;
}): Promise<AuthActionResult> {
  return finalizeAuthLoginAction(() => googleLoginService(payload));
}

export async function googleOneTapAction(payload: {
  credential: string;
}): Promise<AuthActionResult> {
  return finalizeAuthLoginAction(() => googleOneTapService(payload));
}
