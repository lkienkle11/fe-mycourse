"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { z } from "zod";
import { INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM } from "@/constants/instructor-admin";
import { usePathname, useRouter } from "@/i18n/navigation";

const portfolioIdSchema = z.string().uuid();

export function isValidInstructorPortfolioId(value: string | null | undefined) {
  if (!value?.trim()) return false;
  return portfolioIdSchema.safeParse(value.trim()).success;
}

export function useInstructorRosterPortfolioQuery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const rawPortfolioId =
    searchParams.get(INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM)?.trim() ?? null;
  const portfolioId = isValidInstructorPortfolioId(rawPortfolioId)
    ? rawPortfolioId
    : null;

  useEffect(() => {
    if (!rawPortfolioId || portfolioId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, portfolioId, rawPortfolioId, router, searchParams]);

  const setPortfolioId = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next?.trim() ?? "";
      if (trimmed && isValidInstructorPortfolioId(trimmed)) {
        params.set(INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM, trimmed);
      } else {
        params.delete(INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { portfolioId, rawPortfolioId, setPortfolioId };
}
