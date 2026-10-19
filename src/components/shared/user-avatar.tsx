import Image from "next/image";
import { cn, pickCharacter } from "@/lib/utils";

type UserAvatarProps = {
  /** Display name; drives the initials fallback and the default alternative text. */
  name: string;
  /** Picture URL; when falsy the coloured initials are shown instead. */
  src?: string | null;
  /** Alternative text; defaults to `"<name> avatar"`. Pass `""` for a decorative avatar. */
  alt?: string;
  /** Pixel width and height handed to `next/image`. */
  size: number;
  /** Layout classes for both the picture and the fallback (size, shape), e.g. `size-10`. */
  className?: string;
  /** Initials text size classes; defaults to `text-xs`. */
  textClassName?: string;
  /** Set for remote API pictures whose host is not configured for optimisation. */
  unoptimized?: boolean;
};

/**
 * User picture (`next/image`) or coloured initials (`pickCharacter`) in a circle.
 */
export function UserAvatar({
  name,
  src,
  alt,
  size,
  className,
  textClassName = "text-xs",
  unoptimized,
}: UserAvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? `${name} avatar`}
        width={size}
        height={size}
        unoptimized={unoptimized}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const { label, color, backgroundColor } = pickCharacter(name);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{ backgroundColor }}
    >
      <span
        style={{ color }}
        className={cn("font-semibold leading-none", textClassName)}
      >
        {label}
      </span>
    </div>
  );
}
