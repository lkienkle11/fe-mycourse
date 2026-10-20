import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  hasAuthSessionCookies,
  resolveGuestHomeRedirectPath,
  resolveSignedInHomeRedirectPath,
} from "@/lib/navigation/signed-in-home-redirect";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  const { pathname } = request.nextUrl;
  const hasSession = hasAuthSessionCookies(request.cookies);
  const redirectPath =
    resolveSignedInHomeRedirectPath({ pathname, hasSession }) ??
    resolveGuestHomeRedirectPath({ pathname, hasSession });

  if (redirectPath) {
    const redirect = NextResponse.redirect(
      new URL(redirectPath, request.url),
      307,
    );
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("Vary", "Cookie");
    for (const setCookie of response.headers.getSetCookie()) {
      redirect.headers.append("Set-Cookie", setCookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
