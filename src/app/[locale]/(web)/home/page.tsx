import { getTranslations } from "next-intl/server";
import { signedInHomeRobotsMode } from "@/lib/security/web/crawl-policy";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { SignedInHomePage } from "@/screen/common/home/signed-in-home-page";

export async function generateMetadata() {
  const t = await getTranslations("home.signedIn");
  return {
    title: t("pageTitle"),
    robots: robotsPreset(signedInHomeRobotsMode()),
  };
}

export default function SignedInHomeRoutePage() {
  return <SignedInHomePage />;
}
