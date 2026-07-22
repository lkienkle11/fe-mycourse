/**
 * Browser-bound auth caller singletons (browserApiMethods + Zustand reporter).
 * Client/hooks only — Server Actions must not import this module.
 */

import { browserApiMethods } from "@/api/transport/browser-api-methods";
import { createAuthCallers } from "./auth-factory";

const browserAuthCallers = createAuthCallers(browserApiMethods);

export const getMeService = browserAuthCallers.getMeService;
export const loginService = browserAuthCallers.loginService;
export const registerService = browserAuthCallers.registerService;
export const confirmService = browserAuthCallers.confirmService;
export const googleLoginService = browserAuthCallers.googleLoginService;
export const googleOneTapService = browserAuthCallers.googleOneTapService;
export const xLoginService = browserAuthCallers.xLoginService;
export const discordLoginService = browserAuthCallers.discordLoginService;
export const logoutService = browserAuthCallers.logoutService;
export const patchMeService = browserAuthCallers.patchMeService;
export const deleteMeService = browserAuthCallers.deleteMeService;
export const hardDeleteMeService = browserAuthCallers.hardDeleteMeService;
export const getMyPermissionsService =
  browserAuthCallers.getMyPermissionsService;
