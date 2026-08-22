"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Search, SearchX } from "lucide-react";
import type { NormalizedMedia, SearchScope } from "@/lib/domain/media";
import { CoverImage } from "./cover-image";
import { clampText } from "@/lib/utils";
import { getDisplaySubtitle, getDisplayTitle } from "@/lib/media-title";

const tabs: Array<{ value: SearchScope; label: string }> = [
  { value: "all", label: "全部" },
  { value: "anime", label: "Anime" },
  { value: "visual-novel", label: "Galgame" },
];

const sourceLabels: Record<string, string> = { bangumi: "Bangumi", anilist: "AniList", vndb: "VNDB" };

export function SearchWorkspace({ initialQuery = "", initialScope = "all", initialResults = [], initialFailedSources = [], initialError = "" }: { initialQuery?: string; initialScope?: SearchScope; initialResults?: NormalizedMedia[]; initialFailedSources?: string[]; initialError?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [results, setResults] = useState<NormalizedMedia[]>(initialResults);
  const [failedSources, setFailedSources] = useState<string[]>(initialFailedSources);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(initialQuery.trim().length >= 2);
  const [error, setError] = useState(initialError);
  const requestId = useRef(0);

  const runSearch = useCallback(async (nextQuery: string, nextScope: SearchScope) => {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setSearched(true);
    setFailedSources([]);
    const targetUrl = `/search?q=${encodeURIComponent(trimmed)}&type=${nextScope}`;
    if (`${window.location.pathname}${window.location.search}` !== targetUrl) window.history.replaceState(null, "", targetUrl);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${nextScope}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "搜索失败。");
      if (currentRequest !== requestId.current) return;
      setResults(payload.results ?? []);
      setFailedSources(payload.failedSources ?? []);
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setResults([]);
      setFailedSources([]);
      setError(caught instanceof Error ? caught.message : "搜索失败。");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("请输入至少两个字符。");
      return;
    }
    void runSearch(query, scope);
  }

  function changeScope(nextScope: SearchScope) {
    setScope(nextScope);
    if (query.trim().length >= 2) void runSearch(query, nextScope);
    else window.history.replaceState(null, "", `/search?type=${nextScope}`);
  }

  return (
    <div className="space-y-7">
      <form onSubmit={submit} className="surface p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field search-input h-12" placeholder="输入中文名、日文名、英文名或别名" aria-label="作品标题" /></div>
          <button className="button-primary min-w-28" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}{loading ? "搜索中" : "搜索"}</button>
        </div>
        <div className="mt-3 flex gap-2">
          {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => changeScope(tab.value)} className={`rounded-lg px-3 py-1.5 text-sm ${scope === tab.value ? "bg-violet-500/18 text-violet-200" : "text-slate-500 hover:text-slate-300"}`}>{tab.label}</button>)}
        </div>
      </form>
      {failedSources.length > 0 && <div className="rounded-xl border border-amber-300/15 bg-amber-300/8 p-4 text-sm text-amber-100">部分数据源暂时不可用：{failedSources.map((source) => sourceLabels[source] ?? source).join("、")}。已显示可用结果。</div>}
      {error && <div className="rounded-xl border border-rose-400/15 bg-rose-400/8 p-4 text-sm text-rose-200">{error}</div>}
      {!loading && searched && !results.length && !error && <div className="surface grid min-h-64 place-items-center p-8 text-center"><div><SearchX className="mx-auto size-9 text-slate-600" /><p className="mt-3 font-medium">没有找到匹配作品</p><p className="mt-1 text-sm text-slate-500">可以换一个标题，或在下方手动添加。</p></div></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((item) => {
          const title = getDisplayTitle(item);
          const subtitle = getDisplaySubtitle(item);
          const sources = [...new Set((item.metadataSources ?? [item.source]).map((source) => sourceLabels[source] ?? source))];
          return <Link key={`${item.source}-${item.externalId}`} href={`/search/${item.source}/${item.externalId}`} className="group surface flex min-h-44 gap-4 overflow-hidden p-3 transition hover:-translate-y-0.5 hover:border-violet-400/25">
            <div className="media-card-cover relative h-40 w-28 shrink-0 overflow-hidden rounded-xl">
              <CoverImage src={item.coverUrl} alt={title} className="size-full object-cover" />
            </div>
            <div className="min-w-0 py-1 pr-2"><div className="flex flex-wrap items-center gap-2"><span className="media-type-badge rounded-md px-2 py-1 text-[10px] uppercase tracking-wider">{item.mediaType === "ANIME" ? "Anime" : "Galgame"}</span>{item.releaseYear && <span className="text-xs text-slate-500">{item.releaseYear}</span>}<span className="text-[10px] tracking-wide text-slate-600">{sources.join(" + ")}</span></div><h2 className="mt-3 line-clamp-2 text-lg font-semibold group-hover:text-violet-300">{title}</h2>{subtitle && subtitle !== title && <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>}<p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{clampText(item.description)}</p>{process.env.NODE_ENV === "development" && <details className="mt-3 text-[10px] text-slate-600"><summary>调试元数据</summary><pre className="mt-1 whitespace-pre-wrap">{JSON.stringify({ displayTitle: title, titleCn: item.titleCn, titleCnSource: item.titleCnSource, originalTitle: item.originalTitle, matchedBangumiId: item.bangumiId, matchedVndbId: item.vndbId, matchedAniListId: item.anilistId, mergeConfidence: item.mergeConfidence }, null, 2)}</pre></details>}</div>
          </Link>;
        })}
      </div>
    </div>
  );
}
