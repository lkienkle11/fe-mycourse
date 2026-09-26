"use client";

import { useRouter } from "@/i18n/navigation";
import { AuthCardFrame } from "./auth-card-frame";
import { LoginContent } from "./login-content";
import { LoginSignupLayout } from "./login-signup-layout";

/** Full-page `/login` fallback (direct navigation, hard refresh, shared link). */
export function LoginPageContent() {
  const router = useRouter();

  return (
    <AuthCardFrame>
      <LoginSignupLayout type="login">
        <LoginContent
          variant="page"
          onAuthenticated={(destination) => router.push(destination)}
        />
      </LoginSignupLayout>
    </AuthCardFrame>
  );
}
