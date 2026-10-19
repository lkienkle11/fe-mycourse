import { User } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { courseDetailHref } from "@/lib/navigation/routes";

/** Card wrapper: a link to the course page when the slug is non-empty, a plain block otherwise. */
export function CourseCardFrame({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const className = "flex flex-col gap-1";
  return slug ? (
    <Link href={courseDetailHref(slug)} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

/** Owner line shared by the home course cards; renders nothing without an owner name. */
export function CourseOwnerLine({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <p className="flex items-center gap-1 text-sm leading-[18px] text-base-primary">
      <User className="size-[18px] shrink-0 text-object-black/60" aria-hidden />
      <span className="truncate">{name}</span>
    </p>
  );
}
