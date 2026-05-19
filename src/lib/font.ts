import { Geist_Mono, Roboto } from "next/font/google";
import localFont from "next/font/local";

/** Sans mặc định toàn app (Tailwind `font-sans`, biến `--font-sans`). */
export const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Gilroy: một family với đủ weight/style từ `public/assets/fonts`.
 * Dùng qua `font-gilroy` hoặc `var(--font-gilroy)`.
 * Heavy dùng 850 để tránh trùng Black (900) cho cùng style normal/italic.
 */
export const gilroy = localFont({
  src: [
    {
      path: "../../public/assets/fonts/gilroy-thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-thin-italic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-xlight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-xlight-italic.otf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-light-italic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-medium-italic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-semibold-italic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-bold-italic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-xbold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-xbold-italic.otf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-heavy.otf",
      weight: "850",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-heavy-italic.otf",
      weight: "850",
      style: "italic",
    },
    {
      path: "../../public/assets/fonts/gilroy-black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/assets/fonts/gilroy-black-italic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-gilroy",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
