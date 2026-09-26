import { getTranslations } from "next-intl/server";
import { LoginPageContent } from "@/components/common/auth-menu/auth/login-page-content";
import {
  robotsModeForPublicRouteKey,
  robotsPreset,
} from "@/lib/seo/robots-presets";

export async function generateMetadata() {
  const t = await getTranslations("auth.loginPage");
  return {
    title: t("pageTitle"),
    robots: robotsPreset(robotsModeForPublicRouteKey("login")),
  };
}

export default function LoginPage() {
  return (
    <section className="container mx-auto px-4 py-16">
      <LoginPageContent />
    </section>
  );
}
