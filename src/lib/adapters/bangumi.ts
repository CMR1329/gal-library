import type { NormalizedMedia } from "@/lib/domain/media";
import { plainText } from "@/lib/utils";
import { ExternalApiError, fetchWithTimeout } from "./errors";

const ENDPOINT = "https://api.bgm.tv/v0";

type BangumiSubject = Record<string, any>;

function headers() {
  const result: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": process.env.BANGUMI_USER_AGENT || "yoru-library/local-personal-app",
  };
  if (process.env.BANGUMI_ACCESS_TOKEN) result.Authorization = `Bearer ${process.env.BANGUMI_ACCESS_TOKEN}`;
  return result;
}

function infoboxValues(subject: BangumiSubject, keys: string[]) {
  const keySet = new Set(keys);
  return (subject.infobox ?? [])
    .filter((entry: any) => keySet.has(entry.key))
    .flatMap((entry: any) => Array.isArray(entry.value) ? entry.value : [entry.value])
    .map((value: any) => typeof value === "string" ? value : value?.v)
    .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value: string) => value.trim());
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))];
}

function normalize(subject: BangumiSubject, expectedType?: "ANIME" | "VISUAL_NOVEL"): NormalizedMedia {
  const mediaType = subject.type === 2 ? "ANIME" : subject.type === 4 ? "VISUAL_NOVEL" : expectedType;
  if (!mediaType) throw new ExternalApiError("Bangumi 返回了不支持的作品类型。", 502);
  const chineseAlias = infoboxValues(subject, ["中文名"])[0] || null;
  const trustedChineseTitle = subject.name_cn || chineseAlias;
  const aliases = unique([
    ...infoboxValues(subject, ["别名", "中文名", "英文名", "日文名"]),
    subject.name,
    subject.name_cn,
  ]);
  const releaseDate = /^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(subject.date ?? "") ? subject.date : null;
  const title = trustedChineseTitle || subject.name || `Bangumi #${subject.id}`;
  return {
    source: "bangumi",
    externalId: String(subject.id),
    mediaType,
    title,
    titleCn: trustedChineseTitle,
    titleCnSource: trustedChineseTitle ? "bangumi" : null,
    originalTitle: subject.name || null,
    romanizedTitle: null,
    englishTitle: null,
    alternateTitles: aliases.filter((value) => value !== title && value !== subject.name),
    coverUrl: subject.images?.large || subject.images?.common || subject.images?.medium || null,
    bannerUrl: null,
    description: plainText(subject.summary),
    releaseDate,
    endDate: null,
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
    format: subject.platform || (mediaType === "VISUAL_NOVEL" ? "Visual Novel" : null),
    status: null,
    genres: [],
    tags: (subject.tags ?? []).slice(0, 18).map((tag: any) => tag.name).filter(Boolean),
    studios: mediaType === "ANIME" ? infoboxValues(subject, ["动画制作", "制作", "製作"] ) : [],
    developers: mediaType === "VISUAL_NOVEL" ? infoboxValues(subject, ["开发", "开发商", "制作", "品牌"] ) : [],
    publishers: mediaType === "VISUAL_NOVEL" ? infoboxValues(subject, ["发行", "发行商"] ) : [],
    platforms: subject.platform ? [subject.platform] : [],
    languages: [],
    episodes: subject.total_episodes || subject.eps || null,
    episodeDuration: null,
    lengthMinutes: null,
    season: null,
    relations: [],
    externalReferences: [{ source: "bangumi", externalId: String(subject.id) }],
    metadataSources: ["bangumi"],
    bangumiId: String(subject.id),
    raw: subject,
  };
}

async function request(path: string, init?: RequestInit) {
  const response = await fetchWithTimeout(`${ENDPOINT}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });
  if (response.status === 404) throw new ExternalApiError("Bangumi 中没有找到该作品。", 404);
  if (response.status === 429) throw new ExternalApiError("Bangumi 请求过于频繁，请稍后再试。", 429);
  if (!response.ok) throw new ExternalApiError("Bangumi 暂时无法响应，请稍后再试。", 502);
  return response.json();
}

export async function searchBangumi(query: string, mediaType: "ANIME" | "VISUAL_NOVEL") {
  const type = mediaType === "ANIME" ? 2 : 4;
  const payload = await request("/search/subjects?limit=12&offset=0", {
    method: "POST",
    body: JSON.stringify({ keyword: query, sort: "match", filter: { type: [type], nsfw: false } }),
  });
  return (payload.data ?? []).map((subject: BangumiSubject) => normalize(subject, mediaType));
}

export async function getBangumiMedia(id: string) {
  if (!/^\d+$/.test(id)) throw new ExternalApiError("无效的 Bangumi 作品编号。", 400);
  return normalize(await request(`/subjects/${id}`));
}
