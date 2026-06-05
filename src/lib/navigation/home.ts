import { homeHref } from "@/lib/navigation/routes";
import type { useRouter } from "@/i18n/navigation";

type AppRouter = ReturnType<typeof useRouter>;

export { homeHref };

export function navigateToHome(router: Pick<AppRouter, "push">): void {
  router.push(homeHref);
}
