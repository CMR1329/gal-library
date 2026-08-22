import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Database, Star, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { StatusPill } from "@/components/status-pill";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/current-user";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { getDisplaySubtitle, getDisplayTitle } from "@/lib/media-title";
import { formatDate, safeJsonParse } from "@/lib/utils";
import type { NormalizedMedia } from "@/lib/domain/media";

export const dynamic = "force-dynamic";

export default async function PublicMediaPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await db.user.findUnique({ where: { username: decodedUsername }, select: { id: true, username: true, displayName: true, name: true, profileVisibility: true } });
  if (!user) notFound();
  const session = await getCurrentSession();
  if (user.profileVisibility !== "PUBLIC" && session?.user?.id !== user.id) notFound();
  const entry = await db.userEntry.findUnique({
    where: { userId_mediaId: { userId: user.id, mediaId: id } },
    include: { media: { include: { externalMetadata: true, externalReferences: true } } },
  });
  if (!entry) notFound();
  const metadata = safeJsonParse<Partial<NormalizedMedia>>(entry.media.externalMetadata?.metadataJson, {});
  const displayTitle = getDisplayTitle(entry.media);
  const displaySubtitle = getDisplaySubtitle(entry.media);
  const people = entry.media.mediaType === "ANIME" ? metadata.studios : metadata.developers;
  const publicHandle = user.username || decodedUsername;
  const profilePath = `/user/${encodeURIComponent(publicHandle)}`;
  const references = entry.media.externalReferences.map((reference) => `${reference.source}:${reference.externalId}`).join(" · ");

  return <div className="space-y-6">
    <Link href={profilePath} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="size-4" />返回 {user.username || decodedUsername} 的主页</Link>
    <section className="surface relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72">{entry.media.bannerUrl && <CoverImage src={entry.media.bannerUrl} alt="" className="size-full opacity-25 blur-sm" />}<div className="hero-overlay absolute inset-0" /></div>
      <div className="relative flex flex-col gap-7 p-5 pt-10 sm:flex-row sm:p-8 sm:pt-20">
        <div className="media-card-cover relative aspect-[2/3] w-44 shrink-0 self-center overflow-hidden rounded-2xl sm:self-start"><CoverImage src={entry.media.coverUrl} alt={displayTitle} className="size-full object-cover" /></div>
        <div className="min-w-0 flex-1 self-end"><div className="flex flex-wrap items-center gap-2"><span className="media-type-badge rounded-full border px-3 py-1 text-xs">{MEDIA_TYPE_LABELS[entry.media.mediaType]}</span><StatusPill status={entry.status} mediaType={entry.media.mediaType} /></div><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{displayTitle}</h1>{displaySubtitle && <p className="mt-2 text-slate-400">{displaySubtitle}</p>}<div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-500">{entry.score != null && <span className="flex items-center gap-1.5 text-amber-300"><Star className="size-4 fill-current" />{entry.score.toFixed(1)}</span>}<span>收藏于 {formatDate(entry.addedAt)}</span></div></div>
      </div>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="surface p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">External metadata</p><h2 className="mt-2 text-xl font-semibold">作品资料</h2><p className="mt-6 whitespace-pre-line leading-7 text-slate-400">{entry.media.description || "暂无简介。"}</p>{metadata.tags?.length ? <div className="mt-6 flex flex-wrap gap-2">{metadata.tags.map((tag) => <span key={tag} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400">{tag}</span>)}</div> : null}</section>
      <aside className="surface h-fit p-6"><h2 className="font-semibold">资料摘要</h2><dl className="mt-5 space-y-4"><Info icon={CalendarDays} label="播出 / 发售" value={entry.media.releaseDate} /><Info icon={Users} label={entry.media.mediaType === "ANIME" ? "Studio" : "开发商"} value={people?.join("、")} /><Info icon={Clock3} label="长度" value={metadata.episodes ? `${metadata.episodes} 集` : metadata.lengthMinutes ? `约 ${Math.round(metadata.lengthMinutes / 60)} 小时` : null} /><Info icon={Database} label="来源" value={`${entry.media.externalMetadata?.source ?? "manual"} · ${entry.media.externalMetadata?.externalId ?? "—"}`} /><Info icon={Database} label="外部引用" value={references || null} /></dl></aside>
    </div>
  </div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value?: string | null }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-slate-600" /><div><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-300">{value || "—"}</dd></div></div>;
}
