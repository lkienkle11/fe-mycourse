import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer, Header } from "@/components/common";

type WebLayoutProps = {
  children: ReactNode;
  hasFooter?: boolean;
};

export default async function WebLayout({ children }: WebLayoutProps) {
  const locale = await getLocale();
  const switchedLocale = locale === "vi" ? "en" : "vi";

  return (
    <>
      <Header switchedLocale={switchedLocale} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
