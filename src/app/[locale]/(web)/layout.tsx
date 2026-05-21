import type { ReactNode } from "react";
import { Footer, Header } from "@/components/common";

type WebLayoutProps = {
  children: ReactNode;
  hasFooter?: boolean;
};

export default async function WebLayout({ children }: WebLayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
