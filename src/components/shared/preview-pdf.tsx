"use client";

import dynamic from "next/dynamic";

import type { PreviewPdfViewerProps } from "@/components/shared/preview-pdf-viewer";

const PreviewPdfViewer = dynamic(
  () =>
    import("@/components/shared/preview-pdf-viewer").then(
      (mod) => mod.PreviewPdfViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
        Loading PDF…
      </div>
    ),
  },
);

type PreviewPdfProps = PreviewPdfViewerProps;

/**
 * Inline PDF preview via @react-pdf-viewer (toolbar, zoom, sidebar).
 * Loaded client-only — pdfjs-dist must not run during SSR/Turbopack bundling.
 */
export function PreviewPdf({ url, ...rest }: PreviewPdfProps) {
  if (!url) return null;
  return <PreviewPdfViewer url={url} {...rest} />;
}
