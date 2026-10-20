import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { DEFAULT_SITE_NAME } from "@/constants/seo/metadata";
import { geistMono, gilroy, roboto } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = {
  title: DEFAULT_SITE_NAME,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${gilroy.variable} ${geistMono.variable} font-roboto h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
