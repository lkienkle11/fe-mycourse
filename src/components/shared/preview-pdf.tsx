"use client";

type PreviewPdfProps = {
  url: string;
  title?: string;
  className?: string;
};

/**
 * Inline PDF preview. Uses iframe fallback (no @react-pdf-viewer in package.json).
 */
export function PreviewPdf({
  url,
  title = "PDF preview",
  className,
}: PreviewPdfProps) {
  if (!url) return null;

  return (
    <iframe
      src={url}
      title={title}
      className={className ?? "h-[480px] w-full rounded-md border bg-muted"}
    />
  );
}
