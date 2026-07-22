import { rawFetch } from "@/api/raw-http";
import { normalizeDedupeKey } from "./search-text";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const SEARCH_TIMEOUT_MS = 5000;
const SPARQL_TIMEOUT_MS = 12000;

const EXACT_LABEL_RELEVANCE = 100;
const PREFIX_LABEL_RELEVANCE = 70;

const BLOCKED_LABEL_SUFFIXES = [
  "mafia",
  "park",
  "honey",
  "holdings",
  "galaxy",
  "lions",
  "sdk",
  "branch",
  "program",
  "award",
  "article",
  "stadium",
  "arena",
  "extension",
  "credit",
  "licence",
  "license",
];

const BAD_DESCRIPTION_TERMS = [
  "family name",
  "given name",
  "human",
  "day of the week",
  "disambiguation",
  "creative work",
  "film",
  "music by",
  "song",
  "album",
  "single by",
  "wikinews",
  "python library",
  "javascript library",
  "software library",
  "browser extension",
  "soccer-specific",
  "stadium",
  "sports venue",
  "term used to indicate",
  "group of former",
  "award given",
  "bug bounty",
  "honorable mention",
  "payment method",
  "proprietary payment",
  "wikimedia",
  "heavy metal band",
  "youtuber",
  "documentary",
  "violent public disturbance",
  "commune in",
  "ep by",
];

const VIDEO_GAME_COMPANY_DESCRIPTION =
  /\bvideo game (developer|development|publisher|publishing|studio|company|holding|holding company)\b/;

export interface WikidataCompanyResult {
  qid: string;
  label: string;
  description?: string;
  domain?: string;
  location?: string;
  score: number;
}

interface WikidataSearchHit {
  id: string;
  label: string;
  description?: string;
  matchType?: "label" | "alias" | "description";
  matchText?: string;
}

interface FilteredCompanyRow {
  qid: string;
  label: string;
  description?: string;
}

function extractDomain(rawUrl?: string): string {
  if (!rawUrl) return "";
  try {
    const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function qidFromUri(uri: string): string {
  return uri.split("/").pop() ?? "";
}

function isVideoGameTitleDescription(description: string): boolean {
  const desc = description.toLowerCase();
  if (VIDEO_GAME_COMPANY_DESCRIPTION.test(desc)) {
    return false;
  }
  return /\bvideo game\b/.test(desc);
}

function isBadSearchDescription(description?: string): boolean {
  const desc = (description ?? "").toLowerCase();
  if (!desc) return false;
  if (isVideoGameTitleDescription(desc)) return true;
  return BAD_DESCRIPTION_TERMS.some((term) => desc.includes(term));
}

function isRelevantCompanySearchHit(
  hit: WikidataSearchHit,
  query: string,
): boolean {
  if (isBadSearchDescription(hit.description)) {
    return false;
  }

  const labelRelevance = getLabelRelevanceScore(hit.label, query);
  if (labelRelevance < PREFIX_LABEL_RELEVANCE) {
    return false;
  }

  if (hit.matchType === "alias") {
    return labelRelevance >= EXACT_LABEL_RELEVANCE;
  }

  return true;
}

function pickBetterSearchHit(
  existing: WikidataSearchHit,
  next: WikidataSearchHit,
  query: string,
): WikidataSearchHit {
  const existingRelevant = isRelevantCompanySearchHit(existing, query);
  const nextRelevant = isRelevantCompanySearchHit(next, query);
  if (existingRelevant && !nextRelevant) return existing;
  if (!existingRelevant && nextRelevant) return next;

  const existingScore = getLabelRelevanceScore(existing.label, query);
  const nextScore = getLabelRelevanceScore(next.label, query);
  return nextScore > existingScore ? next : existing;
}

function hasBlockedLabelSuffix(remainder: string): boolean {
  const tokens = remainder.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.some((token) => BLOCKED_LABEL_SUFFIXES.includes(token));
}

function getLabelRelevanceScore(label: string, query: string): number {
  const normalizedQuery = normalizeDedupeKey(query);
  const normalizedLabel = normalizeDedupeKey(label);
  if (!normalizedQuery || !normalizedLabel) return -1;

  if (normalizedLabel === normalizedQuery) {
    return EXACT_LABEL_RELEVANCE;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    const remainder = normalizedLabel.slice(normalizedQuery.length);
    if (!remainder) {
      return EXACT_LABEL_RELEVANCE;
    }
    if (hasBlockedLabelSuffix(remainder)) {
      return -1;
    }
    return PREFIX_LABEL_RELEVANCE;
  }

  if (
    normalizedQuery.length >= 4 &&
    normalizedLabel.includes(normalizedQuery)
  ) {
    return 30;
  }

  return -1;
}

function filterSearchHits(
  hits: WikidataSearchHit[],
  query: string,
): WikidataSearchHit[] {
  return hits.filter((hit) => isRelevantCompanySearchHit(hit, query));
}

async function wbSearchEntities(
  query: string,
  language: string,
): Promise<WikidataSearchHit[]> {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbsearchentities",
    search: query,
    language,
    uselang: language,
    type: "item",
    format: "json",
    origin: "*",
    limit: "12",
  }).toString();

  const result = await rawFetch<{
    search?: Array<{
      id: string;
      label: string;
      description?: string;
      match?: { type?: string; text?: string };
    }>;
  }>(url.toString(), {
    timeout: SEARCH_TIMEOUT_MS,
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  return (result.data?.search ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    matchType: item.match?.type as WikidataSearchHit["matchType"],
    matchText: item.match?.text,
  }));
}

function mergeSearchHits(
  primary: WikidataSearchHit[],
  secondary: WikidataSearchHit[],
  query: string,
): WikidataSearchHit[] {
  const byId = new Map<string, WikidataSearchHit>();
  for (const hit of [...primary, ...secondary]) {
    const existing = byId.get(hit.id);
    if (!existing) {
      byId.set(hit.id, hit);
      continue;
    }
    byId.set(hit.id, pickBetterSearchHit(existing, hit, query));
  }
  return [...byId.values()];
}

function buildTypeFilterQuery(qids: string[]): string {
  const values = qids.map((id) => `wd:${id}`).join("\n    ");
  return `
SELECT ?item ?itemLabel ?itemDescription WHERE {
  VALUES ?item {
    ${values}
  }
  ?item wdt:P31/wdt:P279* ?type.
  VALUES ?type {
    wd:Q783794
    wd:Q4830453
    wd:Q6881511
    wd:Q167037
    wd:Q3918
    wd:Q189004
    wd:Q38723
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }
}`;
}

function buildEnrichmentQuery(qids: string[]): string {
  const values = qids.map((id) => `wd:${id}`).join("\n    ");
  return `
SELECT ?item ?officialWebsite ?headquartersLabel WHERE {
  VALUES ?item {
    ${values}
  }
  OPTIONAL { ?item wdt:P856 ?officialWebsite. }
  OPTIONAL {
    ?item wdt:P159 ?headquarters.
    ?headquarters rdfs:label ?headquartersLabel
    FILTER(LANG(?headquartersLabel) IN ("vi", "en"))
  }
}`;
}

async function runSparql(
  query: string,
): Promise<Array<Record<string, { value: string } | undefined>>> {
  const sparqlUrl = new URL(SPARQL_ENDPOINT);
  sparqlUrl.search = new URLSearchParams({ format: "json", query }).toString();

  const result = await rawFetch<{
    results?: {
      bindings?: Array<Record<string, { value: string } | undefined>>;
    };
  }>(sparqlUrl.toString(), {
    timeout: SPARQL_TIMEOUT_MS,
    signal: AbortSignal.timeout(SPARQL_TIMEOUT_MS),
    headers: { Accept: "application/sparql-results+json" },
  });

  return result.data?.results?.bindings ?? [];
}

function parseFilteredCompanies(
  bindings: Array<Record<string, { value: string } | undefined>>,
): FilteredCompanyRow[] {
  const byQid = new Map<string, FilteredCompanyRow>();
  for (const row of bindings) {
    const qid = qidFromUri(row.item?.value ?? "");
    if (!qid || byQid.has(qid)) continue;
    byQid.set(qid, {
      qid,
      label: row.itemLabel?.value ?? qid,
      description: row.itemDescription?.value,
    });
  }
  return [...byQid.values()];
}

function parseEnrichment(
  bindings: Array<Record<string, { value: string } | undefined>>,
): Map<string, { domain?: string; location?: string }> {
  const byQid = new Map<string, { domain?: string; location?: string }>();

  for (const row of bindings) {
    const qid = qidFromUri(row.item?.value ?? "");
    if (!qid) continue;

    const current = byQid.get(qid) ?? {};
    const domain = extractDomain(row.officialWebsite?.value);
    if (domain && !current.domain) current.domain = domain;

    const location = row.headquartersLabel?.value;
    if (location && !current.location) current.location = location;

    byQid.set(qid, current);
  }

  return byQid;
}

function scoreCompany(
  company: FilteredCompanyRow,
  query: string,
  searchRank: number,
  enrichment?: { domain?: string; location?: string },
): number {
  let score = 5;

  if (enrichment?.domain) score += 1;
  if (enrichment?.location) score += 2;
  if (company.description) score += 1;

  const labelRelevance = getLabelRelevanceScore(company.label, query);
  if (labelRelevance >= EXACT_LABEL_RELEVANCE) score += 4;
  else if (labelRelevance >= PREFIX_LABEL_RELEVANCE) score += 2;

  score += Math.max(0, 6 - searchRank);
  return score;
}

function dedupeByLabel(
  results: WikidataCompanyResult[],
): WikidataCompanyResult[] {
  const byLabel = new Map<string, WikidataCompanyResult>();
  for (const result of results) {
    const key = normalizeDedupeKey(result.label);
    const existing = byLabel.get(key);
    if (!existing || result.score > existing.score) {
      byLabel.set(key, result);
    }
  }
  return [...byLabel.values()];
}

export async function searchWikidataCompanies(
  query: string,
  limit = 8,
): Promise<WikidataCompanyResult[]> {
  try {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const [viResult, enResult] = await Promise.allSettled([
      wbSearchEntities(trimmed, "vi"),
      wbSearchEntities(trimmed, "en"),
    ]);
    const viHits = viResult.status === "fulfilled" ? viResult.value : [];
    const enHits = enResult.status === "fulfilled" ? enResult.value : [];
    const mergedHits = filterSearchHits(
      mergeSearchHits(viHits, enHits, trimmed),
      trimmed,
    ).slice(0, 20);
    if (mergedHits.length === 0) return [];

    const rankByQid = new Map(mergedHits.map((hit, index) => [hit.id, index]));
    const filteredBindings = await runSparql(
      buildTypeFilterQuery(mergedHits.map((hit) => hit.id)),
    );
    const filteredCompanies = parseFilteredCompanies(filteredBindings);
    if (filteredCompanies.length === 0) return [];

    const enrichmentBindings = await runSparql(
      buildEnrichmentQuery(filteredCompanies.map((company) => company.qid)),
    );
    const enrichmentByQid = parseEnrichment(enrichmentBindings);

    const ranked = dedupeByLabel(
      filteredCompanies
        .map((company) => {
          const enrichment = enrichmentByQid.get(company.qid);
          const searchHit = mergedHits.find((hit) => hit.id === company.qid);
          return {
            qid: company.qid,
            label: company.label,
            description: company.description || searchHit?.description,
            domain: enrichment?.domain,
            location: enrichment?.location,
            score: scoreCompany(
              company,
              trimmed,
              rankByQid.get(company.qid) ?? 99,
              enrichment,
            ),
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score ||
            (rankByQid.get(a.qid) ?? 99) - (rankByQid.get(b.qid) ?? 99),
        ),
    );

    return ranked.slice(0, limit);
  } catch {
    return [];
  }
}
