import { ImageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { IMAGE_SIZES_COURSE_CARD } from "@/constants/seo/image";
import { cn } from "@/lib/utils";

type CourseThumbnailProps = {
  /** Remote thumbnail URL from the API; a placeholder is shown when absent. */
  src?: string;
  alt: string;
  className?: string;
  /** Overlay content positioned inside the rounded thumbnail (for example a progress bar). */
  children?: ReactNode;
};

/** 16:9 course thumbnail: remote image (unoptimized, like other API images) or a neutral placeholder. */
export function CourseThumbnail({
  src,
  alt,
  className,
  children,
}: CourseThumbnailProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-[23px] bg-muted",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={IMAGE_SIZES_COURSE_CARD}
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-8" aria-hidden />
        </div>
      )}
      {children}
    </div>
  );
}
