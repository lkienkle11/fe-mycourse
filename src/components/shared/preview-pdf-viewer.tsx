"use client";

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import { resolvePdfWorkerUrl } from "@/lib/pdf-worker-url";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PDF_WORKER_URL = resolvePdfWorkerUrl();

export type PreviewPdfViewerProps = {
  url: string;
  title?: string;
  className?: string;
};

export function PreviewPdfViewer({
  url,
  title = "PDF preview",
  className,
}: PreviewPdfViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <section
      aria-label={title}
      className={
        className ??
        "h-[480px] w-full overflow-hidden rounded-md border bg-muted"
      }
    >
      <Worker workerUrl={PDF_WORKER_URL}>
        <Viewer
          fileUrl={url}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={SpecialZoomLevel.PageWidth}
        />
      </Worker>
    </section>
  );
}
