import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { MediaCard } from "@/components/media-card";
import { ShareProfileButton } from "@/components/share-profile-button";
import type { ProfileEntry, ProfileSummaryEntry, ProfileUser } from "@/lib/profile-data";
import { formatDate } from "@/lib/utils";

export function ProfileShowcase({
  user,
  entries,
  allEntries,
  selectedType,
  selectedStatus,
  profilePath,
  managementActions,
}: {
  user: ProfileUser;
  entries: ProfileEntry[];
  allEntries: ProfileSummaryEntry[];
  selectedType?: string;
  selectedStatus?: string;
  profilePath: string;
  managementActions?: ReactNode;
}) {
  const stats = {
    anime: allEntries.filter((entry) => entry.media.mediaType === "ANIME").length,
    galgame: allEntries.filter((entry) => entry.media.mediaType === "VISUAL_NOVEL").length,
    completed: allEntries.filter((entry) => entry.status === "COMPLETED").length,
    inProgress: allEntries.filter((entry) => entry.status === "IN_PROGRESS").length,
    planned: allEntries.filter((entry) => entry.status === "PLANNED").length,
  };
  const displayName = user.username || user.name || "用户主页";
  const publicHandle = user.username || "";
  const query = new URLSearchParams();
  function filterHref(type?: string, status?: string) {
    if (type) query.set("type", type); else query.delete("type");
    if (status) query.set("status", status); else query.delete("status");
    const value = query.toString();
    return `${profilePath}${value ? `?${value}` : ""}`;
  }

  const typeTabs = [{ value: undefined, label: "全部" }, { value: "galgame", label: "Galgame" }, { value: "anime", label: "Anime" }];
  const statusTabs = [
    { value: undefined, label: "全部" },
    { value: "PLANNED", label: selectedType === "ANIME" ? "想看" : selectedType === "VISUAL_NOVEL" ? "想玩" : "想看 / 想玩" },
    { value: "IN_PROGRESS", label: selectedType === "ANIME" ? "正在看" : selectedType === "VISUAL_NOVEL" ? "正在玩" : "进行中" },
    { value: "COMPLETED", label: selectedType === "ANIME" ? "看过" : selectedType === "VISUAL_NOVEL" ? "玩过" : "已完成" },
  ];

  return <div className="space-y-7">
    <section className="surface relative overflow-visible p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {user.image || user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image || user.avatarUrl || ""} alt="" className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-white/10" />
          ) : <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-white/10"><UserRound className="size-8" /></div>}
          <div className="min-w-0"><p className="text-sm font-medium text-violet-300">Public library</p><h1 className="mt-1 truncate text-3xl font-semibold">{displayName}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays className="size-3.5" />加入于 {formatDate(user.createdAt)}</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><ShareProfileButton path={`/share/${encodeURIComponent(publicHandle)}`} />{managementActions}</div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Anime" value={stats.anime} />
        <Stat label="Galgame" value={stats.galgame} />
        <Stat label="已完成 / 玩过" value={stats.completed} />
        <Stat label="正在进行" value={stats.inProgress} />
        <Stat label="想看 / 想玩" value={stats.planned} />
      </div>
    </section>

    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-slate-500">Collection</p><h2 className="mt-1 text-2xl font-semibold">收藏作品</h2></div><p className="text-sm text-slate-500">共 {allEntries.length} 部作品</p></div>
      <div className="mt-5 flex flex-wrap gap-2">{typeTabs.map((tab) => <Link key={tab.label} href={filterHref(tab.value, selectedStatus)} className={`rounded-full border px-3.5 py-2 text-sm ${selectedType === (tab.value === "anime" ? "ANIME" : tab.value === "galgame" ? "VISUAL_NOVEL" : undefined) ? "border-violet-400/40 bg-violet-500/15 text-violet-200" : "border-white/8 text-slate-500 hover:border-violet-400/25 hover:text-slate-300"}`}>{tab.label}</Link>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{statusTabs.map((tab) => <Link key={tab.value || "all"} href={filterHref(selectedType === "ANIME" ? "anime" : selectedType === "VISUAL_NOVEL" ? "galgame" : undefined, tab.value)} className={`rounded-full px-3 py-1.5 text-sm ${selectedStatus === tab.value ? "bg-violet-500/18 text-violet-200" : "text-slate-500 hover:text-slate-300"}`}>{tab.label}{tab.value && <span className="ml-1 text-xs opacity-60">{allEntries.filter((entry) => entry.status === tab.value && (!selectedType || entry.media.mediaType === selectedType)).length}</span>}</Link>)}</div>
    </section>

    {entries.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{entries.map((entry) => <MediaCard key={entry.id} entry={entry} href={`${profilePath}/media/${entry.media.id}`} showProgress={false} />)}</div> : <div className="surface grid min-h-64 place-items-center p-8 text-center"><div><p className="text-lg font-medium">这里还没有公开收藏</p><p className="mt-2 text-sm text-slate-500">调整筛选条件，或等待收藏出现在这里。</p></div></div>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/8 bg-white/5 p-4"><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>;
}
