import { describe, expect, it } from "vitest";
import type { NormalizedMedia } from "@/lib/domain/media";
import { normalizeSearchText, rankSearchResults } from "./index";

const base: NormalizedMedia = {
  source: "bangumi", externalId: "test-1", mediaType: "ANIME", title: "原始标题", titleCn: "中文匹配标题", originalTitle: "原始标题", alternateTitles: ["常用别名"], coverUrl: null, bannerUrl: null, description: null, releaseDate: null, endDate: null, releaseYear: null, format: null, status: null, genres: [], tags: [], studios: [], developers: [], publishers: [], platforms: [], languages: [], episodes: null, episodeDuration: null, lengthMinutes: null, season: null, relations: [], externalReferences: [{ source: "bangumi", externalId: "test-1" }], metadataSources: ["bangumi"], raw: {},
};

describe("search relevance", () => {
  it("normalizes full-width punctuation and spacing", () => {
    expect(normalizeSearchText("  中文＊标题 ～  ")).toBe(normalizeSearchText("中文*标题~"));
  });

  it("ranks a Chinese title exact match above description-only matches", () => {
    const descriptionOnly = { ...base, externalId: "test-2", title: "另一个作品", titleCn: "另一个作品", description: "介绍中提到中文匹配标题" };
    const ranked = rankSearchResults([descriptionOnly, base], "中文匹配标题");
    expect(ranked[0].externalId).toBe("test-1");
    expect(ranked[0].relevanceScore).toBeGreaterThan(ranked[1].relevanceScore ?? 0);
  });
});
