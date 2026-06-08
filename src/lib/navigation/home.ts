import type { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";

type AppRouter = ReturnType<typeof useRouter>;

export { homeHref };

export function navigateToHome(router: Pick<AppRouter, "push">): void {
  router.push(homeHref);
}
