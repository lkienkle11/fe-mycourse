import { z } from "zod";

function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.trim()) return null;
    return url;
  } catch {
    return null;
  }
}

function hostMatchesDomain(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

export function isOptionalHttpUrl(raw: string): boolean {
  return parseHttpUrl(raw) !== null || raw.trim() === "";
}

export function isOptionalLinkedInUrl(raw: string): boolean {
  if (raw.trim() === "") return true;
  const url = parseHttpUrl(raw);
  if (!url) return false;
  return hostMatchesDomain(url.hostname, "linkedin.com");
}

export function isOptionalGitHubUrl(raw: string): boolean {
  if (raw.trim() === "") return true;
  const url = parseHttpUrl(raw);
  if (!url) return false;
  return hostMatchesDomain(url.hostname, "github.com");
}

const optionalHttpUrlSchema = z.union([
  z.literal(""),
  z.string().trim().refine(isOptionalHttpUrl, { message: "validation.url" }),
]);

export const optionalLinkedInUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const url = parseHttpUrl(val);
      if (!url) {
        ctx.addIssue({ code: "custom", message: "validation.url" });
        return;
      }
      if (!hostMatchesDomain(url.hostname, "linkedin.com")) {
        ctx.addIssue({ code: "custom", message: "validation.linkedinUrl" });
      }
    }),
]);

export const optionalGitHubUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const url = parseHttpUrl(val);
      if (!url) {
        ctx.addIssue({ code: "custom", message: "validation.url" });
        return;
      }
      if (!hostMatchesDomain(url.hostname, "github.com")) {
        ctx.addIssue({ code: "custom", message: "validation.githubUrl" });
      }
    }),
]);

export const portfolioLinkItemSchema = z.union([
  z.literal(""),
  z.string().trim().refine(isOptionalHttpUrl, { message: "validation.url" }),
]);

export const optionalCredentialUrlSchema = optionalHttpUrlSchema;
