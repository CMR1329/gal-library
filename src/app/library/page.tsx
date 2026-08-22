import { Prisma } from "@/generated/prisma";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { BackupPanel } from "@/components/backup-panel";
import { requirePageUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { ENTRY_STATUSES, getStatusOptions } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的收藏" };

type Params = { type?: string; q?: string; status?: string; sort?: string; year?: string; playYear?: string; tag?: string };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const userId = (await requirePageUser("/library")).id;
  const selectedMediaType = params.type === "anime" ? "ANIME" : params.type === "visual-novel" ? "VISUAL_NOVEL" : undefined;
  const mediaWhere: Prisma.MediaWhereInput = {};
  if (selectedMediaType) mediaWhere.mediaType = selectedMediaType;
  if (params.q?.trim()) {
    const query = params.q.trim();
    mediaWhere.OR = [
      { title: { contains: query } },
      { titleCn: { contains: query } },
      { originalTitle: { contains: query } },
      { alternateTitles: { contains: query } },
    ];
  }
  if (params.year && /^\d{4}$/.test(params.year)) mediaWhere.releaseYear = Number(params.year);

  const where: Prisma.UserEntryWhereInput = { userId, media: mediaWhere };
  if (params.playYear && /^\d{4}$/.test(params.playYear)) where.activityYear = Number(params.playYear);
  if (params.status && params.status in ENTRY_STATUSES) where.status = params.status;
  if (params.tag) where.tags = { some: { tag: { name: params.tag, userId } } };

  const orderBy: Prisma.UserEntryOrderByWithRelationInput = params.sort === "score-desc" ? { score: { sort: "desc", nulls: "last" } }
    : params.sort === "score-asc" ? { score: { sort: "asc", nulls: "last" } }
    : params.sort === "completed" ? { completedAt: { sort: "desc", nulls: "last" } }
    : { addedAt: params.sort === "added-asc" ? "asc" : "desc" };

  const statusBaseWhere: Prisma.UserEntryWhereInput = { userId, ...(selectedMediaType ? { media: { mediaType: selectedMediaType } } : {}) };
  const [entries, tags, years, playYears, ...statusCounts] = await Promise.all([
    db.userEntry.findMany({ where, include: { media: true }, orderBy }),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.media.findMany({ where: { userEntries: { some: { userId } }, releaseYear: { not: null } }, select: { releaseYear: true }, distinct: ["releaseYear"], orderBy: { releaseYear: "desc" } }),
    db.userEntry.findMany({ where: { userId, activityYear: { not: null } }, select: { activityYear: true }, distinct: ["activityYear"], orderBy: { activityYear: "desc" } }),
    ...getStatusOptions(selectedMediaType).map(({ value }) => db.userEntry.count({ where: { ...statusBaseWhere, status: value } })),
  ]);

  const queryParams = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  function withParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(queryParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/library?${next}`;
  }

  const typeTabs = [{ value: undefined, label: "全部" }, { value: "anime", label: "Anime" }, { value: "visual-novel", label: "Galgame" }];
  const statusTabs = getStatusOptions(selectedMediaType);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-violet-300">My archive</p><h1 className="mt-2 text-3xl font-semibold">我的收藏库</h1><p className="mt-2 text-sm text-slate-500">共 {entries.length} 部符合条件的作品</p></div>
        <BackupPanel />
      </div>

      <div>
        <div className="flex gap-1 border-b border-white/8">
          {typeTabs.map(({ value, label }) => <Link key={label} href={withParams({ type: value, status: undefined })} className={`border-b-2 px-4 py-3 text-sm ${(params.type || undefined) === value ? "border-violet-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>{label}</Link>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={withParams({ status: undefined })} className={`rounded-full px-3 py-1.5 text-sm ${!params.status ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>全部状态</Link>
          {statusTabs.map(({ value, label }, index) => <Link key={value} href={withParams({ status: value })} className={`rounded-full px-3 py-1.5 text-sm ${params.status === value ? "bg-violet-500/18 text-violet-200" : "text-slate-500 hover:text-slate-300"}`}>{label} <span className="ml-1 text-xs opacity-60">{statusCounts[index]}</span></Link>)}
        </div>
      </div>

      <form className="surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input type="hidden" name="type" value={params.type ?? ""} /><input type="hidden" name="status" value={params.status ?? ""} />
        <label className="relative sm:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><input name="q" defaultValue={params.q} placeholder="中文名、原名、罗马字或别名" className="field library-search-input" /></label>
        <select name="sort" defaultValue={params.sort ?? "added-desc"} className="field"><option value="added-desc">最近加入</option><option value="added-asc">最早加入</option><option value="score-desc">评分从高到低</option><option value="score-asc">评分从低到高</option><option value="completed">最近完成</option></select>
        <select name="year" defaultValue={params.year ?? ""} className="field"><option value="">作品年份</option>{years.map(({ releaseYear }) => <option key={releaseYear} value={releaseYear!}>{releaseYear}</option>)}</select>
        <select name="playYear" defaultValue={params.playYear ?? ""} className="field"><option value="">观看 / 游玩年份</option>{playYears.map(({ activityYear }) => <option key={activityYear} value={activityYear!}>{activityYear}</option>)}</select>
        <select name="tag" defaultValue={params.tag ?? ""} className="field"><option value="">全部标签</option>{tags.map((tag) => <option key={tag.id} value={tag.name}>{tag.name}</option>)}</select>
        <div className="flex justify-end gap-3 sm:col-span-2 lg:col-span-6"><Link href="/library" className="button-secondary order-1">清空</Link><button className="button-primary order-2"><Filter className="size-4" />筛选</button></div>
      </form>

      {entries.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{entries.map((entry) => <MediaCard key={entry.id} entry={entry} />)}</div> : <div className="surface grid min-h-72 place-items-center p-8 text-center"><div><p className="text-lg font-medium">这里还没有作品</p><p className="mt-2 text-sm text-slate-500">新账号默认为空，只有主动收藏的作品会出现在这里。</p><Link href="/search" className="button-primary mt-5">搜索作品</Link></div></div>}
    </div>
  );
}
