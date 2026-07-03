"use client";

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { useMemo } from "react";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

type PreviewPdfProps = {
  url: string;
  title?: string;
  className?: string;
};

/**
 * Inline PDF preview via @react-pdf-viewer (toolbar, zoom, sidebar).
 */
export function PreviewPdf({
  url,
  title = "PDF preview",
  className,
}: PreviewPdfProps) {
  const defaultLayoutPluginInstance = useMemo(() => defaultLayoutPlugin(), []);

  if (!url) return null;

  return (
    <section
      aria-label={title}
      className={
        className ??
        "h-[480px] w-full overflow-hidden rounded-md border bg-muted"
      }
    >
      <Worker workerUrl={pdfWorkerUrl}>
        <Viewer
          fileUrl={url}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={SpecialZoomLevel.PageWidth}
        />
      </Worker>
    </section>
  );
}
