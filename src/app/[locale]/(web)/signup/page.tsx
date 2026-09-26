import { getTranslations } from "next-intl/server";
import { SignupPageContent } from "@/components/common/auth-menu/auth/signup-page-content";
import {
  robotsModeForPublicRouteKey,
  robotsPreset,
} from "@/lib/seo/robots-presets";

export async function generateMetadata() {
  const t = await getTranslations("auth.signupPage");
  return {
    title: t("pageTitle"),
    robots: robotsPreset(robotsModeForPublicRouteKey("signup")),
  };
}

export default function SignupPage() {
  return (
    <section className="container mx-auto px-4 py-16">
      <SignupPageContent />
    </section>
  );
}
