import type { Metadata } from "next";
import { geistMono, gilroy, roboto } from "@/lib/font";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyCourse FE",
  description: "Next.js 16 starter with i18n and app stack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} ${gilroy.variable} ${geistMono.variable} font-roboto h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
