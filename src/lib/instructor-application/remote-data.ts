import { rawFetch } from "@/api/raw-http";
import { MOCK_COMPANIES } from "./mock-companies";
import { MOCK_JOB_TITLES } from "./mock-job-titles";
import {
  normalizeDedupeKey,
  normalizeDomainKey,
  normalizeSearchText,
} from "./search-text";

export const REMOTE_JOB_TITLES_URL =
  "https://du-lieu-ho-so.pages.dev/chuc-danh.json";
export const REMOTE_COMPANIES_URL =
  "https://du-lieu-ho-so.pages.dev/cong-ty.json";

const REMOTE_FETCH_TIMEOUT_MS = 8000;

export interface RemoteJobTitle {
  id: string;
  label: string;
  description?: string;
}

export interface RemoteCompany {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  location?: string;
}

let jobTitlesCache: RemoteJobTitle[] | null = null;
let companiesCache: RemoteCompany[] | null = null;
let jobTitlesPromise: Promise<RemoteJobTitle[]> | null = null;
let companiesPromise: Promise<RemoteCompany[]> | null = null;

function toFallbackJobTitles(): RemoteJobTitle[] {
  return MOCK_JOB_TITLES.map((item) => ({
    id: item.id.startsWith("local-") ? `fallback:${item.id}` : item.id,
    label: item.label,
    description: item.description,
  }));
}

function toFallbackCompanies(): RemoteCompany[] {
  return MOCK_COMPANIES.map((item) => ({
    id: item.id,
    name: item.name,
    domain: item.domain,
    description: item.description,
    location: item.location,
  }));
}

async function fetchRemoteJson<T>(url: string): Promise<T[]> {
  const result = await rawFetch<T[]>(url, {
    timeout: REMOTE_FETCH_TIMEOUT_MS,
    signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS),
  });
  const data = result.data;
  return Array.isArray(data) ? data : [];
}

export async function loadRemoteJobTitles(): Promise<RemoteJobTitle[]> {
  if (jobTitlesCache) return jobTitlesCache;
  if (!jobTitlesPromise) {
    jobTitlesPromise = (async () => {
      try {
        jobTitlesCache = await fetchRemoteJson<RemoteJobTitle>(
          REMOTE_JOB_TITLES_URL,
        );
        if (jobTitlesCache.length === 0) {
          throw new Error("Empty remote job titles");
        }
      } catch {
        jobTitlesCache = toFallbackJobTitles();
      }
      return jobTitlesCache;
    })();
  }
  return jobTitlesPromise;
}

export async function loadRemoteCompanies(): Promise<RemoteCompany[]> {
  if (companiesCache) return companiesCache;
  if (!companiesPromise) {
    companiesPromise = (async () => {
      try {
        companiesCache =
          await fetchRemoteJson<RemoteCompany>(REMOTE_COMPANIES_URL);
        if (companiesCache.length === 0) {
          throw new Error("Empty remote companies");
        }
      } catch {
        companiesCache = toFallbackCompanies();
      }
      return companiesCache;
    })();
  }
  return companiesPromise;
}

export function searchRemoteJobTitles(
  dataset: RemoteJobTitle[],
  query: string,
  limit = 8,
): RemoteJobTitle[] {
  const q = normalizeSearchText(query);
  if (!q) return dataset.slice(0, limit);
  return dataset
    .filter((item) => {
      const label = normalizeSearchText(item.label);
      const description = normalizeSearchText(item.description ?? "");
      return label.includes(q) || description.includes(q);
    })
    .slice(0, limit);
}

export function searchRemoteCompanies(
  dataset: RemoteCompany[],
  query: string,
  limit = 8,
): RemoteCompany[] {
  const q = normalizeSearchText(query);
  if (!q) return dataset.slice(0, limit);
  return dataset
    .filter((item) => {
      const name = normalizeSearchText(item.name);
      const domain = normalizeSearchText(item.domain ?? "");
      const description = normalizeSearchText(item.description ?? "");
      const location = normalizeSearchText(item.location ?? "");
      return (
        name.includes(q) ||
        domain.includes(q) ||
        description.includes(q) ||
        location.includes(q)
      );
    })
    .slice(0, limit);
}

export function findRemoteCompanyByName(
  dataset: RemoteCompany[],
  companyName: string,
): RemoteCompany | undefined {
  const key = normalizeDedupeKey(companyName);
  return dataset.find((item) => normalizeDedupeKey(item.name) === key);
}

export function findRemoteCompanyByDomain(
  dataset: RemoteCompany[],
  domain: string,
): RemoteCompany | undefined {
  const key = normalizeDomainKey(domain);
  return dataset.find((item) => {
    const itemDomain = normalizeDomainKey(item.domain ?? "");
    return itemDomain && itemDomain === key;
  });
}

export function preloadRemoteDatasets(): void {
  void loadRemoteJobTitles();
  void loadRemoteCompanies();
}
