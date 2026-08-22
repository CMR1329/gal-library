import type { NormalizedMedia } from "@/lib/domain/media";
import { plainText } from "@/lib/utils";
import { ExternalApiError, fetchWithTimeout } from "./errors";

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large }
  bannerImage
  description(asHtml: false)
  startDate { year month day }
  endDate { year month day }
  seasonYear season episodes duration genres status format
  tags { name rank isGeneralSpoiler isMediaSpoiler }
  studios(isMain: true) { nodes { name isAnimationStudio } }
  relations { edges { relationType node { id title { romaji english native } type } } }
`;

type AniListMedia = Record<string, any>;

function fuzzyDate(date: { year?: number; month?: number; day?: number } | null | undefined) {
  if (!date?.year) return null;
  return [String(date.year), date.month ? String(date.month).padStart(2, "0") : null, date.day ? String(date.day).padStart(2, "0") : null]
    .filter(Boolean)
    .join("-");
}

function normalize(item: AniListMedia): NormalizedMedia {
  const title = item.title?.native || item.title?.romaji || item.title?.english || `AniList #${item.id}`;
  const alternateTitles = [item.title?.romaji, item.title?.english, item.title?.native].filter((value): value is string => Boolean(value && value !== title));
  return {
    source: "anilist",
    externalId: String(item.id),
    mediaType: "ANIME",
    title,
    titleCn: null,
    titleCnSource: null,
    originalTitle: item.title?.native ?? null,
    romanizedTitle: item.title?.romaji ?? null,
    englishTitle: item.title?.english ?? null,
    alternateTitles,
    coverUrl: item.coverImage?.extraLarge || item.coverImage?.large || null,
    bannerUrl: item.bannerImage ?? null,
    description: plainText(item.description),
    releaseDate: fuzzyDate(item.startDate),
    endDate: fuzzyDate(item.endDate),
    releaseYear: item.seasonYear ?? item.startDate?.year ?? null,
    format: item.format ?? null,
    status: item.status ?? null,
    genres: item.genres ?? [],
    tags: (item.tags ?? []).filter((tag: any) => !tag.isGeneralSpoiler && !tag.isMediaSpoiler).sort((a: any, b: any) => b.rank - a.rank).slice(0, 18).map((tag: any) => tag.name),
    studios: (item.studios?.nodes ?? []).filter((studio: any) => studio.isAnimationStudio).map((studio: any) => studio.name),
    developers: [], publishers: [], platforms: [], languages: [],
    episodes: item.episodes ?? null,
    episodeDuration: item.duration ?? null,
    lengthMinutes: null,
    season: item.season ?? null,
    relations: (item.relations?.edges ?? []).filter((edge: any) => edge.node?.type === "ANIME").map((edge: any) => ({
      id: String(edge.node.id),
      title: edge.node.title?.romaji || edge.node.title?.english || edge.node.title?.native || String(edge.node.id),
      relation: edge.relationType,
      official: true,
    })),
    externalReferences: [{ source: "anilist", externalId: String(item.id) }],
    metadataSources: ["anilist"],
    anilistId: String(item.id),
    raw: item,
  };
}

async function request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetchWithTimeout(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (payload.errors?.length) throw new ExternalApiError("AniList 返回了无法处理的查询结果。", 502);
  return payload.data as T;
}

export async function searchAniList(query: string) {
  const data = await request<{ Page: { media: AniListMedia[] } }>(
    `query ($search: String!) { Page(page: 1, perPage: 12) { media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} } } }`,
    { search: query },
  );
  return data.Page.media.map(normalize);
}

export async function getAniListMedia(id: string) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) throw new ExternalApiError("无效的 AniList 作品编号。", 400);
  const data = await request<{ Media: AniListMedia | null }>(
    `query ($id: Int!) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
    { id: numericId },
  );
  if (!data.Media) throw new ExternalApiError("AniList 中没有找到该作品。", 404);
  return normalize(data.Media);
}
