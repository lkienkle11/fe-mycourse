import { LoginSignupPopup } from "@/components/common/auth-menu/auth/login-signup-popup";

/** Intercepted `/signup` — overlays the page the visitor navigated from. */
export default function InterceptedSignupModal() {
  return <LoginSignupPopup type="signup" />;
}
