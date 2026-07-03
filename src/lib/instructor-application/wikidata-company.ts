import { rawFetch } from "@/api/raw-http";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const SEARCH_TIMEOUT_MS = 5000;
const SPARQL_TIMEOUT_MS = 12000;

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
}

interface FilteredCompanyRow {
  qid: string;
  label: string;
  description?: string;
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().trim().replace(/[.,-]/g, "");
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

  const result = await rawFetch<{ search?: WikidataSearchHit[] }>(
    url.toString(),
    {
      timeout: SEARCH_TIMEOUT_MS,
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    },
  );

  return (result.data?.search ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
  }));
}

function mergeSearchHits(
  primary: WikidataSearchHit[],
  secondary: WikidataSearchHit[],
): WikidataSearchHit[] {
  const seen = new Set<string>();
  const merged: WikidataSearchHit[] = [];
  for (const hit of [...primary, ...secondary]) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    merged.push(hit);
  }
  return merged;
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

  const normalizedQuery = normalizeLabel(query);
  const normalizedLabel = normalizeLabel(company.label);
  if (normalizedLabel === normalizedQuery) score += 4;
  else if (
    normalizedLabel.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedLabel)
  ) {
    score += 2;
  }

  score += Math.max(0, 6 - searchRank);
  return score;
}

function isBadSearchDescription(description?: string): boolean {
  const desc = (description ?? "").toLowerCase();
  return [
    "family name",
    "given name",
    "human",
    "day of the week",
    "disambiguation",
    "creative work",
    "video game",
    "film",
  ].some((term) => desc.includes(term));
}

export async function searchWikidataCompanies(
  query: string,
  limit = 8,
): Promise<WikidataCompanyResult[]> {
  try {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const [viHits, enHits] = await Promise.all([
      wbSearchEntities(trimmed, "vi"),
      wbSearchEntities(trimmed, "en"),
    ]);
    const mergedHits = mergeSearchHits(viHits, enHits)
      .filter((hit) => !isBadSearchDescription(hit.description))
      .slice(0, 20);
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

    const ranked = filteredCompanies
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
      );

    return ranked.slice(0, limit);
  } catch {
    return [];
  }
}
