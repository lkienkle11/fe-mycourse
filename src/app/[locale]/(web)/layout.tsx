import type { ReactNode } from "react";
import {
  BecomeInstructorPromoBanner,
  Footer,
  Header,
} from "@/components/common";

type WebLayoutProps = {
  children: ReactNode;
  hasFooter?: boolean;
};

export default async function WebLayout({ children }: WebLayoutProps) {
  return (
    <>
      <BecomeInstructorPromoBanner />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
