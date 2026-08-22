import { ManualForm } from "@/components/manual-form";
import { SearchWorkspace } from "@/components/search-workspace";
import { searchExternalMedia } from "@/lib/adapters";
import type { NormalizedMedia } from "@/lib/domain/media";

export const metadata = { title: "搜索添加" };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const scope = params.type === "anime" || params.type === "visual-novel" ? params.type : "all";
  let initialResults: NormalizedMedia[] = [];
  let initialFailedSources: string[] = [];
  let initialError = "";
  if (params.q?.trim() && params.q.trim().length >= 2) {
    try {
      const batch = await searchExternalMedia(params.q.trim(), scope);
      initialResults = batch.results;
      initialFailedSources = batch.failedSources;
    } catch (error) {
      initialError = error instanceof Error ? error.message : "搜索失败。";
    }
  }
  return <div className="space-y-8"><div><p className="text-sm font-medium text-violet-300">Discover</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">搜索并收藏作品</h1><p className="mt-2 text-slate-500">Anime 使用 Bangumi + AniList，Galgame 使用 Bangumi + VNDB。收藏后合并资料会保存到本地。</p></div><SearchWorkspace initialQuery={params.q ?? ""} initialScope={scope} initialResults={initialResults} initialFailedSources={initialFailedSources} initialError={initialError} /><ManualForm /></div>;
}
