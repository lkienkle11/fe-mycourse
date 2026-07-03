"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import type { useMyInstructorApplication } from "@/hooks/instructor/use-my-instructor-application";
import type { InstructorApplicationPageState } from "@/lib/instructor-application/page-state";
import { INSTRUCTOR_PAGE_STATE } from "@/lib/instructor-application/page-state";
import { cn, formatUnixDateTime } from "@/lib/utils";

export function BecomeInstructorHero() {
  const t = useTranslations("instructor.application");
  return (
    <section className="bg-[#3dcbb1] text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between md:py-8">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{t("hero.title")}</h1>
          <p className="mt-2 max-w-xl text-white/90">{t("hero.subtitle")}</p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-2xl font-bold">50k+</p>
            <p className="text-sm text-white/80">{t("hero.statLearners")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-white/80">{t("hero.statReviewDays")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BecomeInstructorSidebar({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = useTranslations("instructor.application");
  return (
    <>
      <div>
        <h3 className="font-semibold">{t("sidebar.guideTitle")}</h3>
        <ul
          className={cn(
            "mt-3 space-y-2 text-sm text-muted-foreground",
            compact && "text-xs",
          )}
        >
          {["step1", "step2", "step3", "step4", "step5"].map((key) => (
            <li key={key}>{t(`sidebar.${key}` as "sidebar.step1")}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">{t("sidebar.requiredTitle")}</h3>
        <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
          {["req1", "req2", "req3", "req4", "req5", "req6"].map((key) => (
            <li key={key}>{t(`sidebar.${key}` as "sidebar.req1")}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-1 text-sm font-medium transition-colors",
        active
          ? "border-[#3dcbb1] text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function StateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </div>
  );
}

export function StatusBanner({
  pageState,
  application,
}: {
  pageState: InstructorApplicationPageState;
  application: ReturnType<typeof useMyInstructorApplication>["application"];
}) {
  const t = useTranslations("instructor.application.banner");
  const locale = useLocale();
  if (!application) return null;

  if (pageState === INSTRUCTOR_PAGE_STATE.pending_review) {
    return (
      <Banner
        tone="pending"
        title={t("pending.title")}
        badge={t("pending.badge")}
      >
        {t("pending.dateSubmitted", {
          date: formatUnixDateTime(application.submitted_at, locale),
        })}
        <br />
        {t("pending.body")}
      </Banner>
    );
  }
  if (pageState === INSTRUCTOR_PAGE_STATE.returned_for_revision) {
    return (
      <Banner
        tone="returned"
        title={t("returned.title")}
        badge={t("returned.badge")}
      >
        {t("returned.body")}
      </Banner>
    );
  }
  if (pageState === INSTRUCTOR_PAGE_STATE.rejected_can_resubmit) {
    const remaining = Math.max(0, 5 - (application.rejection_count ?? 0));
    return (
      <Banner
        tone="rejected"
        title={t("rejected.title")}
        badge={t("rejected.badge", {
          count: String(application.rejection_count ?? 0),
        })}
      >
        {t("rejected.body", { remaining: String(remaining) })}
      </Banner>
    );
  }
  if (pageState === INSTRUCTOR_PAGE_STATE.rejected_contact_admin) {
    return (
      <Banner
        tone="rejected"
        title={t("blocked.title")}
        badge={t("blocked.badge")}
      >
        {t("blocked.body")}
      </Banner>
    );
  }
  return null;
}

export function Banner({
  tone,
  title,
  badge,
  children,
}: {
  tone: "pending" | "returned" | "rejected";
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  const styles = {
    pending: "border-amber-200 bg-amber-50 text-amber-950",
    returned: "border-sky-200 bg-sky-50 text-sky-950",
    rejected: "border-red-200 bg-red-50 text-red-950",
  }[tone];
  return (
    <div className={cn("mb-6 rounded-md border p-4", styles)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{title}</p>
        <Badge variant="secondary">{badge}</Badge>
      </div>
      <p className="text-sm">{children}</p>
    </div>
  );
}

export function Field({
  label,
  required,
  errorMessage,
  fieldKey,
  children,
}: {
  label: string;
  required?: boolean;
  errorMessage?: string;
  fieldKey?: string;
  children: React.ReactNode;
}) {
  const invalid = Boolean(errorMessage);
  return (
    <div data-form-field={fieldKey}>
      <Label className={cn("mb-2 block", invalid && "text-destructive")}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div
        className={cn(
          invalid &&
            "[&_input]:border-destructive [&_input]:ring-3 [&_input]:ring-destructive/20 [&_textarea]:border-destructive [&_textarea]:ring-3 [&_textarea]:ring-destructive/20",
        )}
        aria-invalid={invalid || undefined}
      >
        {children}
      </div>
      {errorMessage ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function CollapsibleSection({
  title,
  optional,
  defaultOpen,
  children,
}: {
  title: string;
  optional?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("instructor.application.form");
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between p-5 text-left">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {optional ? (
            <p className="text-xs text-muted-foreground">{t("optional")}</p>
          ) : null}
        </div>
        <span>{open ? "▴" : "▾"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pb-5">{children}</CollapsibleContent>
    </Collapsible>
  );
}
