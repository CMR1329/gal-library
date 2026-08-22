export type ExternalSource = "anilist" | "vndb" | "bangumi" | "manual";

export type ExternalReferenceInput = {
  source: Exclude<ExternalSource, "manual">;
  externalId: string;
};

export type NormalizedMedia = {
  source: ExternalSource;
  externalId: string;
  mediaType: "ANIME" | "VISUAL_NOVEL";
  title: string;
  titleCn: string | null;
  /** Only an explicit localized title from a known source; never a translation. */
  titleCnSource?: "bangumi" | "manual" | null;
  originalTitle: string | null;
  romanizedTitle?: string | null;
  englishTitle?: string | null;
  alternateTitles: string[];
  coverUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  releaseDate: string | null;
  endDate: string | null;
  releaseYear: number | null;
  format: string | null;
  status: string | null;
  genres: string[];
  tags: string[];
  studios: string[];
  developers: string[];
  publishers: string[];
  platforms: string[];
  languages: string[];
  episodes: number | null;
  episodeDuration: number | null;
  lengthMinutes: number | null;
  season: string | null;
  relations: Array<{ id: string; title: string; relation: string; official?: boolean }>;
  externalReferences: ExternalReferenceInput[];
  metadataSources?: ExternalSource[];
  bangumiId?: string | null;
  anilistId?: string | null;
  vndbId?: string | null;
  relevanceScore?: number;
  mergeConfidence?: number;
  raw: unknown;
};

export type SearchScope = "all" | "anime" | "visual-novel";
