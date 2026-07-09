import { OAuthPopupCallbackRelay } from "@/components/auth/oauth-popup-callback-relay";
import { X_OAUTH_MESSAGE_TYPE } from "@/hooks/auth/use-x-login";

export default function XOAuthCallbackPage() {
  return (
    <OAuthPopupCallbackRelay
      messageType={X_OAUTH_MESSAGE_TYPE}
      completingLabel="Completing X sign-in…"
      idleLabel="You can close this window and return to MyCourse to sign in."
    />
  );
}
