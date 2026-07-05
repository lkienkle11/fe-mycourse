import packageJson from "../../package.json";

const PDFJS_CDN_BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist";

function pdfjsDistVersionFromPackage(): string {
  const raw = packageJson.dependencies?.["pdfjs-dist"];
  if (!raw || typeof raw !== "string") {
    throw new Error("pdfjs-dist dependency is missing in package.json");
  }
  return raw.trim().replace(/^[\^~>=<]+/, "");
}

/** jsDelivr worker URL for the `pdfjs-dist` version declared in package.json. */
export function buildPdfWorkerCdnUrl(): string {
  return `${PDFJS_CDN_BASE}@${pdfjsDistVersionFromPackage()}/build/pdf.worker.min.js`;
}

export function resolvePdfWorkerUrl(): string {
  const override = process.env.NEXT_PUBLIC_PDF_WORKER_URL?.trim();
  if (override) return override;
  return buildPdfWorkerCdnUrl();
}
