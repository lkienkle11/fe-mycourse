import type { ReactNode } from "react";
import { Header } from "@/components/common/header";
import { getLocale } from "next-intl/server";

type WebLayoutProps = {
  children: ReactNode;
  hasFooter?: boolean;
};

export default async function WebLayout({
  children,
  hasFooter: _hasFooter,
}: WebLayoutProps) {
  const locale = await getLocale();
  const switchedLocale = locale === "vi" ? "en" : "vi";

  return (
    <>
      <Header switchedLocale={switchedLocale} />
      <main>{children}</main>
    </>
  );
}
