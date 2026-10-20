import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { homeHref } from "@/lib/navigation/home";

export default function Home() {
  redirect({ href: homeHref, locale: routing.defaultLocale });
}
