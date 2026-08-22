import { describe, expect, it } from "vitest";
import { getDisplaySubtitle, getDisplayTitle } from "./media-title";

describe("media title display policy", () => {
  it("always prefers an explicit Chinese title", () => {
    expect(getDisplayTitle({ titleCn: "中文标题", titleCnSource: "bangumi", originalTitle: "原始标题", romanizedTitle: "Romanized", englishTitle: "English" })).toBe("中文标题");
    expect(getDisplaySubtitle({ titleCn: "中文标题", titleCnSource: "bangumi", originalTitle: "原始标题", englishTitle: "English" })).toBe("原始标题");
  });

  it("does not treat an unverified provider alias as a Chinese title", () => {
    expect(getDisplayTitle({ title: "Senren * Banka", originalTitle: "千恋＊万花", alternateTitles: '["千变万化"]' })).toBe("千恋＊万花");
    expect(getDisplayTitle({ titleCn: "错误标题", titleCnSource: null, title: "English", originalTitle: "原始标题" })).toBe("原始标题");
  });

  it("falls back through original, romanized and English titles", () => {
    expect(getDisplayTitle({ title: "English", originalTitle: "Japanese", romanizedTitle: "Romaji", englishTitle: "English" })).toBe("Japanese");
    expect(getDisplayTitle({ title: "English", romanizedTitle: "Romaji", englishTitle: "English" })).toBe("Romaji");
  });
});
