import { OAuthPopupCallbackRelay } from "@/components/auth/oauth-popup-callback-relay";
import { DISCORD_OAUTH_MESSAGE_TYPE } from "@/hooks/auth/use-discord-login";

export default function DiscordOAuthCallbackPage() {
  return (
    <OAuthPopupCallbackRelay
      messageType={DISCORD_OAUTH_MESSAGE_TYPE}
      completingLabel="Completing Discord sign-in…"
      idleLabel="You can close this window and return to MyCourse to sign in."
    />
  );
}
