import type { ExternalReferenceInput, ExternalSource, NormalizedMedia, SearchScope } from "@/lib/domain/media";
import { getAniListMedia, searchAniList } from "./anilist";
import { getBangumiMedia, searchBangumi } from "./bangumi";
import { getVndbMedia, searchVndb } from "./vndb";

type ProviderSource = Exclude<ExternalSource, "manual">;

export type MediaProvider = {
  source: ProviderSource;
  search(query: string, mediaType: "ANIME" | "VISUAL_NOVEL"): Promise<NormalizedMedia[]>;
  get(id: string): Promise<NormalizedMedia>;
};

export type SearchBatch = {
  results: NormalizedMedia[];
  failedSources: ProviderSource[];
};

const providers: Record<ProviderSource, MediaProvider> = {
  anilist: { source: "anilist", search: (query) => searchAniList(query), get: getAniListMedia },
  vndb: { source: "vndb", search: (query) => searchVndb(query), get: getVndbMedia },
  bangumi: { source: "bangumi", search: searchBangumi, get: getBangumiMedia },
};

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[＊*]/g, "*")
    .replace(/[～~]/g, "~")
    .replace(/[・·]/g, "·")
    .replace(/[\p{P}\p{S}\s]/gu, "")
    .trim();
}

function titles(media: NormalizedMedia) {
  return [media.titleCn, media.title, media.originalTitle, media.romanizedTitle, media.englishTitle, ...media.alternateTitles]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSearchText)
    .filter(Boolean);
}

function sameWork(left: NormalizedMedia, right: NormalizedMedia) {
  if (left.mediaType !== right.mediaType) return false;
  if (left.releaseYear && right.releaseYear && Math.abs(left.releaseYear - right.releaseYear) > 1) return false;
  const rightTitles = new Set(titles(right));
  return titles(left).some((title) => rightTitles.has(title));
}

function uniqueStrings(...groups: Array<Array<string | null | undefined>>) {
  return [...new Set(groups.flat().filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))];
}

function uniqueReferences(...groups: ExternalReferenceInput[][]) {
  const seen = new Set<string>();
  return groups.flat().filter((ref) => {
    const key = `${ref.source}:${ref.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSources(...groups: Array<ExternalSource[] | undefined>) {
  return [...new Set(groups.flatMap((group) => group ?? []))];
}

function mergeBangumiWithDetails(localized: NormalizedMedia, details: NormalizedMedia): NormalizedMedia {
  return {
    ...details,
    source: "bangumi",
    externalId: localized.externalId,
    title: localized.titleCn || localized.title || details.title,
    titleCn: localized.titleCn || details.titleCn,
    titleCnSource: localized.titleCn ? localized.titleCnSource || null : details.titleCnSource || null,
    originalTitle: localized.originalTitle || details.originalTitle,
    romanizedTitle: details.romanizedTitle || localized.romanizedTitle,
    englishTitle: details.englishTitle || localized.englishTitle,
    alternateTitles: uniqueStrings(localized.alternateTitles, details.alternateTitles, [details.title, details.originalTitle, details.romanizedTitle, details.englishTitle]),
    coverUrl: localized.coverUrl || details.coverUrl,
    description: localized.description || details.description,
    releaseDate: localized.releaseDate || details.releaseDate,
    releaseYear: localized.releaseYear || details.releaseYear,
    tags: uniqueStrings(localized.tags, details.tags),
    genres: uniqueStrings(localized.genres, details.genres),
    studios: uniqueStrings(localized.studios, details.studios),
    developers: uniqueStrings(localized.developers, details.developers),
    publishers: uniqueStrings(localized.publishers, details.publishers),
    platforms: uniqueStrings(localized.platforms, details.platforms),
    languages: uniqueStrings(localized.languages, details.languages),
    externalReferences: uniqueReferences(localized.externalReferences, details.externalReferences),
    metadataSources: uniqueSources(localized.metadataSources, details.metadataSources),
    bangumiId: localized.bangumiId || localized.externalId,
    anilistId: details.anilistId || localized.anilistId,
    vndbId: details.vndbId || localized.vndbId,
    mergeConfidence: 1,
    raw: { bangumi: localized.raw, details: details.raw },
  };
}

function mergeGeneric(left: NormalizedMedia, right: NormalizedMedia): NormalizedMedia {
  const localized = left.titleCn ? left : right.titleCn ? right : left;
  return {
    ...left,
    title: localized.titleCn || localized.title || left.title,
    titleCn: localized.titleCn || left.titleCn || right.titleCn,
    titleCnSource: localized.titleCn ? localized.titleCnSource || null : left.titleCnSource || right.titleCnSource || null,
    originalTitle: left.originalTitle || right.originalTitle,
    romanizedTitle: left.romanizedTitle || right.romanizedTitle,
    englishTitle: left.englishTitle || right.englishTitle,
    alternateTitles: uniqueStrings(left.alternateTitles, right.alternateTitles, [right.title, right.originalTitle, right.romanizedTitle, right.englishTitle]),
    coverUrl: left.coverUrl || right.coverUrl,
    description: left.description || right.description,
    releaseDate: left.releaseDate || right.releaseDate,
    releaseYear: left.releaseYear || right.releaseYear,
    tags: uniqueStrings(left.tags, right.tags),
    genres: uniqueStrings(left.genres, right.genres),
    studios: uniqueStrings(left.studios, right.studios),
    developers: uniqueStrings(left.developers, right.developers),
    publishers: uniqueStrings(left.publishers, right.publishers),
    platforms: uniqueStrings(left.platforms, right.platforms),
    languages: uniqueStrings(left.languages, right.languages),
    externalReferences: uniqueReferences(left.externalReferences, right.externalReferences),
    metadataSources: uniqueSources(left.metadataSources, right.metadataSources),
    bangumiId: left.bangumiId || right.bangumiId,
    anilistId: left.anilistId || right.anilistId,
    vndbId: left.vndbId || right.vndbId,
    mergeConfidence: 0.9,
    raw: { primary: left.raw, secondary: right.raw },
  };
}

function mergeCandidates(results: NormalizedMedia[]) {
  const merged: NormalizedMedia[] = [];
  for (const candidate of results) {
    const index = merged.findIndex((existing) => sameWork(existing, candidate));
    if (index < 0) {
      merged.push(candidate);
      continue;
    }
    const existing = merged[index];
    merged[index] = existing.source === "bangumi"
      ? mergeBangumiWithDetails(existing, candidate)
      : candidate.source === "bangumi"
        ? mergeBangumiWithDetails(candidate, existing)
        : mergeGeneric(existing, candidate);
  }
  return merged;
}

function relevanceScore(media: NormalizedMedia, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;
  const fields: Array<[string | null | undefined, number]> = [
    [media.titleCn, 1200],
    ...media.alternateTitles.map((value) => [value, 1080] as [string, number]),
    [media.originalTitle, 1040],
    [media.romanizedTitle, 1000],
    [media.englishTitle, 980],
    [media.title, 960],
  ];
  let best = 0;
  for (const [value, exactScore] of fields) {
    const normalized = normalizeSearchText(value);
    if (!normalized) continue;
    if (normalized === normalizedQuery) best = Math.max(best, exactScore);
    else if (normalized.startsWith(normalizedQuery)) best = Math.max(best, exactScore - 120);
    else if (normalized.includes(normalizedQuery)) best = Math.max(best, exactScore - 260);
  }
  const searchable = `${media.description ?? ""} ${media.tags.join(" ")} ${media.genres.join(" ")}`;
  if (normalizeSearchText(searchable).includes(normalizedQuery)) best = Math.max(best, 80);
  if (media.source === "bangumi") best += 8;
  return best;
}

export function rankSearchResults(results: NormalizedMedia[], query: string) {
  return results
    .map((media) => ({ ...media, relevanceScore: relevanceScore(media, query) }))
    .sort((left, right) => (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0));
}

async function searchType(query: string, mediaType: "ANIME" | "VISUAL_NOVEL"): Promise<SearchBatch> {
  const sourceRequests: Array<[ProviderSource, Promise<NormalizedMedia[]>]> = mediaType === "ANIME"
    ? [["bangumi", searchBangumi(query, mediaType)], ["anilist", searchAniList(query)]]
    : [["bangumi", searchBangumi(query, mediaType)], ["vndb", searchVndb(query)]];
  const settled = await Promise.allSettled(sourceRequests.map(([, request]) => request));
  const failedSources = settled.flatMap((result, index) => result.status === "rejected" ? [sourceRequests[index][0]] : []);
  const results = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!results.length && failedSources.length === sourceRequests.length) throw (settled[0] as PromiseRejectedResult).reason;
  return { results: rankSearchResults(mergeCandidates(results), query), failedSources };
}

export async function searchExternalMedia(query: string, scope: SearchScope): Promise<SearchBatch> {
  if (scope === "anime") return searchType(query, "ANIME");
  if (scope === "visual-novel") return searchType(query, "VISUAL_NOVEL");
  const settled = await Promise.allSettled([searchType(query, "ANIME"), searchType(query, "VISUAL_NOVEL")]);
  const failedSources = settled.flatMap((result) => result.status === "fulfilled" ? result.value.failedSources : ["bangumi", "anilist", "vndb"] as ProviderSource[]);
  const results = rankSearchResults(mergeCandidates(settled.flatMap((result) => result.status === "fulfilled" ? result.value.results : [])), query);
  if (!results.length && settled.every((result) => result.status === "rejected")) throw (settled[0] as PromiseRejectedResult).reason;
  return { results, failedSources: [...new Set(failedSources)] };
}

export async function getExternalMedia(source: string, id: string) {
  if (source !== "anilist" && source !== "vndb" && source !== "bangumi") throw new Error("不支持的外部资料来源。");
  const media = await providers[source].get(id);
  return source === "bangumi" ? enrichBangumi(media) : media;
}

async function enrichBangumi(media: NormalizedMedia) {
  const query = media.originalTitle || media.title;
  try {
    const candidates = media.mediaType === "ANIME" ? await searchAniList(query) : await searchVndb(query);
    const exact = candidates.find((candidate: NormalizedMedia) => sameWork(media, candidate));
    return exact ? mergeBangumiWithDetails(media, exact) : media;
  } catch {
    return media;
  }
}
