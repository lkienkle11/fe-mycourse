import { PUBLIC_ROUTES } from "@/constants/route";
import type { useRouter } from "@/i18n/navigation";

export const homeHref = PUBLIC_ROUTES.home;

type AppRouter = ReturnType<typeof useRouter>;

export function navigateToHome(router: Pick<AppRouter, "push">): void {
  router.push(homeHref);
}
