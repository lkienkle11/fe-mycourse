import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LogoutContent } from "@/components/common/auth-menu/auth/logout-content";

export async function generateMetadata() {
  const t = await getTranslations("auth.logout");
  return { title: t("pageTitle") };
}

export default async function LogoutPage() {
  const t = await getTranslations("auth.logout");

  return (
    <section className="container mx-auto max-w-lg px-4 py-16">
      <Suspense
        fallback={
          <p className="text-center text-sm text-black/80 py-16">
            {t("loggingOut")}
          </p>
        }
      >
        <LogoutContent />
      </Suspense>
    </section>
  );
}
