import { afterEach, describe, expect, it, vi } from "vitest";
import { searchBangumi } from "./bangumi";

afterEach(() => vi.unstubAllGlobals());

describe("Bangumi Chinese search adapter", () => {
  it("normalizes Chinese titles and aliases without creating a collection record", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{
        id: 24680,
        type: 2,
        name: "架空原名",
        name_cn: "中文检索标题",
        summary: "用于适配器测试的返回值",
        date: "2025-04-01",
        eps: 12,
        images: { large: "https://example.invalid/cover.jpg" },
        infobox: [{ key: "别名", value: [{ v: "常用别名" }] }],
        tags: [{ name: "测试标签" }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchBangumi("中文检索标题", "ANIME");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ source: "bangumi", externalId: "24680", titleCn: "中文检索标题", originalTitle: "架空原名", episodes: 12 });
    expect(results[0].alternateTitles).toContain("常用别名");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("/search/subjects");
  });
});
