import type { NormalizedMedia } from "@/lib/domain/media";
import { ExternalApiError, fetchWithTimeout } from "./errors";

const ENDPOINT = "https://api.vndb.org/kana";
const VN_FIELDS = "title,alttitle,titles{title,latin,lang,official,main},aliases,olang,devstatus,released,languages,platforms,image{url,thumbnail,sexual,violence},length,length_minutes,description,developers{id,name,original},tags{id,name,rating,spoiler,category},relations{id,title,alttitle,relation,relation_official}";

type VndbItem = Record<string, any>;

async function request(path: string, body: Record<string, unknown>) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.VNDB_TOKEN) headers.Authorization = `Token ${process.env.VNDB_TOKEN}`;
  const response = await fetchWithTimeout(`${ENDPOINT}/${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  return response.json();
}

function cleanVndbText(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/\[url=[^\]]+\]([^[]+)\[\/url\]/g, "$1").replace(/\[\/?(?:b|i|u|spoiler)\]/g, "").trim();
}

function normalize(item: VndbItem, releaseInfo?: { publishers: string[] }): NormalizedMedia {
  const title = item.title || item.titles?.find((entry: any) => entry.latin)?.latin || item.alttitle || item.id;
  const alternateTitles = [...(item.aliases ?? []), ...(item.titles ?? []).flatMap((entry: any) => [entry.title, entry.latin].filter(Boolean))]
    .filter((value, index, array) => value !== title && array.indexOf(value) === index);
  const released = typeof item.released === "string" && !["TBA", "unknown"].includes(item.released) ? item.released : null;
  return {
    source: "vndb",
    externalId: item.id,
    mediaType: "VISUAL_NOVEL",
    title,
    titleCn: null,
    titleCnSource: null,
    originalTitle: item.alttitle ?? item.titles?.find((entry: any) => entry.main)?.title ?? null,
    romanizedTitle: item.titles?.find((entry: any) => entry.latin)?.latin ?? null,
    englishTitle: null,
    alternateTitles,
    coverUrl: item.image?.url || item.image?.thumbnail || null,
    bannerUrl: null,
    description: cleanVndbText(item.description),
    releaseDate: released,
    endDate: null,
    releaseYear: released ? Number(released.slice(0, 4)) || null : null,
    format: "Visual Novel",
    status: item.devstatus === 0 ? "FINISHED" : item.devstatus === 1 ? "IN_DEVELOPMENT" : item.devstatus === 2 ? "CANCELLED" : null,
    genres: (item.tags ?? []).filter((tag: any) => tag.category === "cont" && tag.spoiler === 0).sort((a: any, b: any) => b.rating - a.rating).slice(0, 8).map((tag: any) => tag.name),
    tags: (item.tags ?? []).filter((tag: any) => tag.spoiler === 0).sort((a: any, b: any) => b.rating - a.rating).slice(0, 18).map((tag: any) => tag.name),
    studios: [],
    developers: (item.developers ?? []).map((developer: any) => developer.name),
    publishers: releaseInfo?.publishers ?? [],
    platforms: item.platforms ?? [],
    languages: item.languages ?? [],
    episodes: null,
    episodeDuration: null,
    lengthMinutes: item.length_minutes ?? null,
    season: null,
    relations: (item.relations ?? []).map((relation: any) => ({ id: relation.id, title: relation.title || relation.alttitle || relation.id, relation: relation.relation, official: relation.relation_official })),
    externalReferences: [{ source: "vndb", externalId: item.id }],
    metadataSources: ["vndb"],
    vndbId: item.id,
    raw: item,
  };
}

async function getPublishers(id: string) {
  try {
    const payload = await request("release", {
      filters: ["vn", "=", ["id", "=", id]],
      fields: "producers{id,name,publisher,developer}",
      results: 100,
    });
    const names = (payload.results ?? []).flatMap((release: any) => release.producers ?? []).filter((producer: any) => producer.publisher).map((producer: any) => producer.name);
    return [...new Set<string>(names)];
  } catch {
    return [];
  }
}

export async function searchVndb(query: string) {
  const payload = await request("vn", { filters: ["search", "=", query], fields: VN_FIELDS, sort: "searchrank", results: 12 });
  return (payload.results ?? []).map((item: VndbItem) => normalize(item));
}

export async function getVndbMedia(id: string) {
  if (!/^v\d+$/.test(id)) throw new ExternalApiError("无效的 VNDB 作品编号。", 400);
  const [payload, publishers] = await Promise.all([
    request("vn", { filters: ["id", "=", id], fields: VN_FIELDS, results: 1 }),
    getPublishers(id),
  ]);
  const item = payload.results?.[0];
  if (!item) throw new ExternalApiError("VNDB 中没有找到该作品。", 404);
  return normalize(item, { publishers });
}
