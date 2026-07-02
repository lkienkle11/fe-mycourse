import {
  findRemoteCompanyByDomain,
  findRemoteCompanyByName,
  getRemoteDatasetSources,
  loadRemoteCompanies,
  loadRemoteJobTitles,
  type RemoteCompany,
  type RemoteJobTitle,
  searchRemoteCompanies,
  searchRemoteJobTitles,
} from "./remote-data";
import type { ComboboxSuggestion, CompanySearchState } from "./types";
import { searchWikidataCompanies } from "./wikidata-company";

function normalizeLabel(value: string): string {
  return value.toLowerCase().trim().replace(/[.,-]/g, "");
}

function slugifyKey(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
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
    const key = normalizeLabel(item.label);
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
  const seen = new Set(primary.map((item) => normalizeLabel(item.label)));
  const merged = [...primary];
  for (const item of secondary) {
    const key = normalizeLabel(item.label);
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
  const remoteDataset = await loadRemoteJobTitles();
  const q = query.trim();

  if (!q || q.length < 2) {
    return remoteDataset.slice(0, 8).map(toJobTitleSuggestion);
  }

  const remoteMatches = searchRemoteJobTitles(remoteDataset, q, 8).map(
    toJobTitleSuggestion,
  );

  try {
    const url = `https://api.hh.ru/suggests/vacancy_search_keyword?text=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("HH suggest error");
    const data = (await res.json()) as { items?: Array<{ text?: string }> };
    const hhItems: ComboboxSuggestion[] = [];
    for (const item of (data.items ?? []).slice(0, 12)) {
      const label = (item.text ?? "").trim();
      if (!label) continue;
      hhItems.push({ id: deriveHhJobTitleId(label), label });
    }
    return mergeSuggestionsByLabel(dedupeByLabel(hhItems), remoteMatches);
  } catch {
    return remoteMatches;
  }
}

export async function fetchCompanySuggestions(
  query: string,
): Promise<ComboboxSuggestion[]> {
  const remoteDataset = await loadRemoteCompanies();
  const q = query.trim();

  if (!q || q.length < 2) {
    return remoteDataset.slice(0, 8).map(toCompanySuggestion);
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
    return mergeSuggestionsByLabel(apiItems, remoteMatches);
  } catch {
    return remoteMatches.length > 0
      ? remoteMatches
      : remoteDataset.slice(0, 8).map(toCompanySuggestion);
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
  fallbackLabel: string,
  idleLabel: string,
  searchingLabel: string,
): string {
  const sources = getRemoteDatasetSources();
  if (searchState === "searching") return searchingLabel;
  if (searchState === "fallback" || sources.companies === "fallback") {
    return fallbackLabel;
  }
  return idleLabel;
}
