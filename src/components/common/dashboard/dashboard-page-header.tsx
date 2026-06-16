"use client";

import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { DashboardPageHeaderProps } from "@/types/dashboard";

export function DashboardPageHeader({
  breadcrumbs = [],
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  const hasHeaderContent =
    breadcrumbs.length > 0 ||
    title != null ||
    description != null ||
    actions != null;

  if (!hasHeaderContent) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      {breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const itemKey =
                item.key ??
                item.href ??
                (typeof item.label === "string"
                  ? item.label
                  : `breadcrumb-${index}`);

              return (
                <Fragment key={itemKey}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {title != null || description != null || actions != null ? (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            {title != null ? (
              <h1 className="text-2xl font-bold">{title}</h1>
            ) : null}
            {description != null ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions != null ? (
            <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
