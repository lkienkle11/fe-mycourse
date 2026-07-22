import { rawFetch } from "@/api/raw-http";
import {
  findRemoteCompanyByDomain,
  findRemoteCompanyByName,
  loadRemoteCompanies,
  loadRemoteJobTitles,
  type RemoteCompany,
  type RemoteJobTitle,
  searchRemoteCompanies,
  searchRemoteJobTitles,
} from "./remote-data";
import { normalizeDedupeKey, slugifyKey } from "./search-text";
import type { ComboboxSuggestion, CompanySearchState } from "./types";
import { searchWikidataCompanies } from "./wikidata-company";

const JOB_TITLE_QUERY_CACHE = new Map<string, ComboboxSuggestion[]>();
const COMPANY_QUERY_CACHE = new Map<string, ComboboxSuggestion[]>();
const QUERY_CACHE_MAX = 64;

function queryCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

function setQueryCache(
  cache: Map<string, ComboboxSuggestion[]>,
  key: string,
  value: ComboboxSuggestion[],
): void {
  if (cache.size >= QUERY_CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, value);
}

export function deriveRemoteJobTitleId(remoteId: string): string {
  return `remote:${remoteId}`;
}

export function deriveHhJobTitleId(label: string): string {
  return `hh:${slugifyKey(label)}`;
}

export function deriveCustomJobTitleId(label: string): string {
  return `custom:${slugifyKey(label)}`;
}

export function deriveCustomCompanyId(label: string): string {
  return `custom:${slugifyKey(label)}`;
}

export function deriveCompanySuggestionId(input: {
  domain?: string;
  remoteKey?: string;
  wikidataQid?: string;
  label?: string;
}): string {
  const domain = input.domain?.trim();
  if (domain) return domain;
  if (input.wikidataQid) return `wikidata:${input.wikidataQid}`;
  if (input.remoteKey) return `remote:${input.remoteKey}`;
  if (input.label) return deriveCustomCompanyId(input.label);
  return "";
}

function dedupeByLabel<T extends { label: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeDedupeKey(item.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeSuggestionsByLabel(
  primary: ComboboxSuggestion[],
  secondary: ComboboxSuggestion[],
  limit = 8,
): ComboboxSuggestion[] {
  const seen = new Set(primary.map((item) => normalizeDedupeKey(item.label)));
  const merged = [...primary];
  for (const item of secondary) {
    const key = normalizeDedupeKey(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, limit);
}

function toJobTitleSuggestion(item: RemoteJobTitle): ComboboxSuggestion {
  return {
    id: deriveRemoteJobTitleId(item.id),
    label: item.label,
    description: item.description,
  };
}

function toCompanySuggestion(item: RemoteCompany): ComboboxSuggestion {
  return {
    id: deriveCompanySuggestionId({ domain: item.domain, remoteKey: item.id }),
    label: item.name,
    domain: item.domain,
    description: item.description,
    location: item.location,
  };
}

export async function fetchJobTitleSuggestions(
  query: string,
): Promise<ComboboxSuggestion[]> {
  const cacheKey = queryCacheKey(query);
  const cached = JOB_TITLE_QUERY_CACHE.get(cacheKey);
  if (cached) return cached;

  const remoteDataset = await loadRemoteJobTitles();
  const q = query.trim();

  if (!q || q.length < 2) {
    const idle = remoteDataset.slice(0, 8).map(toJobTitleSuggestion);
    setQueryCache(JOB_TITLE_QUERY_CACHE, cacheKey, idle);
    return idle;
  }

  const remoteMatches = searchRemoteJobTitles(remoteDataset, q, 8).map(
    toJobTitleSuggestion,
  );

  try {
    const url = `https://api.hh.ru/suggests/vacancy_search_keyword?text=${encodeURIComponent(q)}`;
    const result = await rawFetch<{ items?: Array<{ text?: string }> }>(url, {
      timeout: 5000,
      signal: AbortSignal.timeout(5000),
    });
    const hhItems: ComboboxSuggestion[] = [];
    for (const item of (result.data?.items ?? []).slice(0, 12)) {
      const label = (item.text ?? "").trim();
      if (!label) continue;
      hhItems.push({ id: deriveHhJobTitleId(label), label });
    }
    const merged = mergeSuggestionsByLabel(
      dedupeByLabel(hhItems),
      remoteMatches,
    );
    setQueryCache(JOB_TITLE_QUERY_CACHE, cacheKey, merged);
    return merged;
  } catch {
    setQueryCache(JOB_TITLE_QUERY_CACHE, cacheKey, remoteMatches);
    return remoteMatches;
  }
}

export async function fetchCompanySuggestions(
  query: string,
): Promise<ComboboxSuggestion[]> {
  const cacheKey = queryCacheKey(query);
  const cached = COMPANY_QUERY_CACHE.get(cacheKey);
  if (cached) return cached;

  const remoteDataset = await loadRemoteCompanies();
  const q = query.trim();

  if (!q || q.length < 2) {
    const idle = remoteDataset.slice(0, 8).map(toCompanySuggestion);
    setQueryCache(COMPANY_QUERY_CACHE, cacheKey, idle);
    return idle;
  }

  const remoteMatches = searchRemoteCompanies(remoteDataset, q, 5).map(
    toCompanySuggestion,
  );

  try {
    const wikidataResults = await searchWikidataCompanies(q, 8);
    const apiItems = dedupeByLabel(
      wikidataResults.map((result) => {
        const remoteMatch =
          findRemoteCompanyByName(remoteDataset, result.label) ??
          (result.domain
            ? findRemoteCompanyByDomain(remoteDataset, result.domain)
            : undefined);
        const domain = result.domain || remoteMatch?.domain;
        return {
          id: deriveCompanySuggestionId({
            domain,
            wikidataQid: result.qid,
          }),
          label: result.label,
          domain,
          description: remoteMatch?.description || result.description,
          location: remoteMatch?.location || result.location,
        };
      }),
    );
    const merged = mergeSuggestionsByLabel(apiItems, remoteMatches);
    setQueryCache(COMPANY_QUERY_CACHE, cacheKey, merged);
    return merged;
  } catch {
    const fallback =
      remoteMatches.length > 0
        ? remoteMatches
        : remoteDataset.slice(0, 8).map(toCompanySuggestion);
    setQueryCache(COMPANY_QUERY_CACHE, cacheKey, fallback);
    return fallback;
  }
}

export function resolveCompanySuggestionById(
  suggestions: ComboboxSuggestion[],
  selectedId: string | undefined,
  selectedIndex: number,
): ComboboxSuggestion | undefined {
  if (selectedId) {
    const byId = suggestions.find((item) => item.id === selectedId);
    if (byId) return byId;
  }
  if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
    return suggestions[selectedIndex];
  }
  return undefined;
}

export function getCompanySourceNote(
  searchState: CompanySearchState,
  idleLabel: string,
  searchingLabel: string,
  noResultsLabel: string,
): string {
  if (searchState === "searching") return searchingLabel;
  if (searchState === "no_results") return noResultsLabel;
  return idleLabel;
}
