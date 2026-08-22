import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Database, Star, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { RecordEditor } from "@/components/record-editor";
import { RefreshMetadataButton } from "@/components/refresh-metadata-button";
import { requirePageUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { formatDate, safeJsonParse } from "@/lib/utils";
import type { NormalizedMedia } from "@/lib/domain/media";
import { getDisplaySubtitle, getDisplayTitle } from "@/lib/media-title";

export const dynamic = "force-dynamic";

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = (await requirePageUser(`/media/${id}`)).id;
  const entry = await db.userEntry.findUnique({
    where: { userId_mediaId: { userId, mediaId: id } },
    include: {
      media: { include: { externalMetadata: true, externalReferences: true } },
      tags: { include: { tag: true } },
      routes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!entry) notFound();

  const metadata = safeJsonParse<Partial<NormalizedMedia>>(entry.media.externalMetadata?.metadataJson, {});
  const displayTitle = getDisplayTitle({ ...entry.media, alternateTitles: entry.media.alternateTitles });
  const displaySubtitle = getDisplaySubtitle({ ...entry.media, alternateTitles: entry.media.alternateTitles });
  const people = entry.media.mediaType === "ANIME" ? metadata.studios : metadata.developers;
  const record = {
    status: entry.status,
    score: entry.score,
    progressCurrent: entry.progressCurrent,
    progressTotal: entry.progressTotal,
    progressText: entry.progressText,
    startedAt: entry.startedAt,
    completedAt: entry.completedAt,
    activityYear: entry.activityYear,
    rewatchCount: entry.rewatchCount,
    plannedRewatch: entry.plannedRewatch,
    playtimeMinutes: entry.playtimeMinutes,
    completedAllRoutes: entry.completedAllRoutes,
    notes: entry.notes,
    tags: entry.tags.map((item) => item.tag.name),
    routes: entry.routes.map((route) => ({ name: route.name, completed: route.completed, completedAt: route.completedAt, notes: route.notes })),
  };
  const references = entry.media.externalReferences.map((reference) => `${reference.source}:${reference.externalId}`).join(" · ");

  return (
    <div className="space-y-6">
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="size-4" />返回收藏库</Link>
      <section className="surface relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72">{entry.media.bannerUrl && <CoverImage src={entry.media.bannerUrl} alt="" className="size-full opacity-25 blur-sm" />}<div className="hero-overlay absolute inset-0" /></div>
        <div className="relative flex flex-col gap-7 p-5 pt-10 sm:flex-row sm:p-8 sm:pt-20">
          <div className="media-card-cover relative aspect-[2/3] w-44 shrink-0 self-center overflow-hidden rounded-2xl sm:self-start">
            <CoverImage src={entry.media.coverUrl} alt={displayTitle} className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 self-end"><span className="rounded-full bg-violet-400/12 px-3 py-1 text-xs text-violet-200">{MEDIA_TYPE_LABELS[entry.media.mediaType]}</span><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{displayTitle}</h1>{displaySubtitle && <p className="mt-2 text-slate-400">{displaySubtitle}</p>}<div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-500">{entry.score != null && <span className="flex items-center gap-1.5 text-amber-300"><Star className="size-4 fill-current" />{entry.score.toFixed(1)}</span>}<span>收藏于 {formatDate(entry.addedAt)}</span><span>更新于 {formatDate(entry.updatedAt)}</span></div></div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">External metadata</p><h2 className="mt-2 text-xl font-semibold">作品资料</h2></div>{entry.media.externalMetadata?.source !== "manual" && <RefreshMetadataButton mediaId={entry.media.id} />}</div>
          <p className="mt-6 whitespace-pre-line leading-7 text-slate-400">{entry.media.description || "暂无简介。"}</p>
          {metadata.tags?.length ? <div className="mt-6 flex flex-wrap gap-2">{metadata.tags.map((tag) => <span key={tag} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400">{tag}</span>)}</div> : null}
        </section>
        <aside className="surface h-fit p-6"><h2 className="font-semibold">资料摘要</h2><dl className="mt-5 space-y-4"><Info icon={CalendarDays} label="播出 / 发售" value={entry.media.releaseDate} /><Info icon={Users} label={entry.media.mediaType === "ANIME" ? "Studio" : "开发商"} value={people?.join("、")} /><Info icon={Clock3} label="长度" value={metadata.episodes ? `${metadata.episodes} 集` : metadata.lengthMinutes ? `约 ${Math.round(metadata.lengthMinutes / 60)} 小时` : null} /><Info icon={Database} label="来源" value={`${entry.media.externalMetadata?.source ?? "manual"} · ${entry.media.externalMetadata?.externalId ?? "—"}`} /><Info icon={Database} label="外部引用" value={references || null} /></dl></aside>
      </div>
      <section className="surface p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Private record</p><h2 className="mt-2 text-xl font-semibold">我的记录</h2><p className="mt-2 text-sm text-slate-500">以下内容属于当前用户，不会上传到任何外部资料来源。</p><div className="my-6 h-px bg-white/8" /><RecordEditor mediaId={entry.media.id} mediaType={entry.media.mediaType} entry={record} /></section>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value?: string | null }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-slate-600" /><div><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-300">{value || "—"}</dd></div></div>;
}
