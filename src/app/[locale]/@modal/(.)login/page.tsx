import { LoginSignupPopup } from "@/components/common/auth-menu/auth/login-signup-popup";

/** Intercepted `/login` — overlays the page the visitor navigated from. */
export default function InterceptedLoginModal() {
  return <LoginSignupPopup type="login" />;
}
