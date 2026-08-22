import { describe, expect, it } from "vitest";
import { clampText, plainText, safeJsonParse } from "./utils";
import { ENTRY_STATUSES } from "./constants";

describe("domain utilities", () => {
  it("converts trusted external descriptions to plain text", () => {
    expect(plainText("<b>标题</b><br>正文 &amp; 更多")).toBe("标题\n正文 & 更多");
  });

  it("falls back when stored JSON is invalid", () => {
    expect(safeJsonParse("not-json", { safe: true })).toEqual({ safe: true });
  });

  it("keeps valid stored JSON", () => {
    expect(safeJsonParse<{ tags: string[] }>("{\"tags\":[\"奇幻\"]}", { tags: [] })).toEqual({ tags: ["奇幻"] });
  });

  it("truncates long summaries", () => {
    expect(clampText("123456", 4)).toBe("1234…");
  });

  it("keeps stable English status keys", () => {
    expect(Object.keys(ENTRY_STATUSES)).toEqual(["PLANNED", "IN_PROGRESS", "COMPLETED"]);
  });
});
