"use client";

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import { resolvePdfWorkerUrl } from "@/lib/pdf-worker-url";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PDF_WORKER_URL = resolvePdfWorkerUrl();

type PreviewPdfProps = {
  url: string;
  title?: string;
  className?: string;
};

function PreviewPdfViewer({
  url,
  title = "PDF preview",
  className,
}: PreviewPdfProps) {
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

/**
 * Inline PDF preview via @react-pdf-viewer (toolbar, zoom, sidebar).
 */
export function PreviewPdf({ url, ...rest }: PreviewPdfProps) {
  if (!url) return null;
  return <PreviewPdfViewer url={url} {...rest} />;
}
