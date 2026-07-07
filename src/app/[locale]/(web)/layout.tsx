import Script from "next/script";
import type { ReactNode } from "react";
import {
  BecomeInstructorPromoBanner,
  Footer,
  Header,
} from "@/components/common";
import { GoogleOneTapHost } from "@/components/providers/google-one-tap-host";

type WebLayoutProps = {
  children: ReactNode;
  hasFooter?: boolean;
};

export default async function WebLayout({ children }: WebLayoutProps) {
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <BecomeInstructorPromoBanner />
      <Header />
      <GoogleOneTapHost />
      <main>{children}</main>
      <Footer />
    </>
  );
}
