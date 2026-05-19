import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ConfirmEmailContent } from "@/components/common/auth-menu/auth/confirm-email-content";

export async function generateMetadata() {
  const t = await getTranslations("auth.confirm");
  return { title: t("pageTitle") };
}

export default async function ConfirmEmailPage() {
  const t = await getTranslations("auth.confirm");

  return (
    <section className="container mx-auto max-w-lg px-4 py-16">
      <Suspense
        fallback={
          <p className="text-center text-sm text-black/80 py-16">
            {t("verifying")}
          </p>
        }
      >
        <ConfirmEmailContent />
      </Suspense>
    </section>
  );
}
