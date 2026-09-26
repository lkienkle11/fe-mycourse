"use client";

import { useRouter } from "@/i18n/navigation";
import { AuthCardFrame } from "./auth-card-frame";
import { LoginSignupLayout } from "./login-signup-layout";
import { SignupContent } from "./signup-content";

/** Full-page `/signup` fallback (direct navigation, hard refresh, shared link). */
export function SignupPageContent() {
  const router = useRouter();

  return (
    <AuthCardFrame>
      <LoginSignupLayout type="signup">
        <SignupContent
          variant="page"
          onAuthenticated={(destination) => router.push(destination)}
        />
      </LoginSignupLayout>
    </AuthCardFrame>
  );
}
