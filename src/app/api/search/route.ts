import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { searchExternalMedia } from "@/lib/adapters";
import type { SearchScope } from "@/lib/domain/media";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const scope = (request.nextUrl.searchParams.get("type") ?? "all") as SearchScope;
  if (query.length < 2) return NextResponse.json({ error: "请输入至少两个字符。" }, { status: 400 });
  if (query.length > 100) return NextResponse.json({ error: "搜索内容不能超过 100 个字符。" }, { status: 400 });
  if (!["all", "anime", "visual-novel"].includes(scope)) return NextResponse.json({ error: "无效的搜索类型。" }, { status: 400 });
  try {
    const batch = await searchExternalMedia(query, scope);
    return NextResponse.json({ results: batch.results, failedSources: batch.failedSources });
  } catch (error) {
    return apiError(error);
  }
}
