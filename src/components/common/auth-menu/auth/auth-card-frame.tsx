import { cn } from "@/lib/utils";

/**
 * Card framing for the full-page `/login` and `/signup` fallback.
 * Mirrors `LoginSignupPopup`'s own card classes (`rounded-xl bg-popover
 * ring-1 ring-foreground/10`), plus a shadow: the modal reads as elevated
 * because of the dimmed backdrop behind it, but a full page has no backdrop,
 * so the shadow is what separates the card from the page background.
 */
export function AuthCardFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-200 overflow-hidden rounded-xl bg-popover shadow-xl ring-1 ring-foreground/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
