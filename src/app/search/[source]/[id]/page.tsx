import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Languages, Monitor, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getExternalMedia } from "@/lib/adapters";
import { CoverImage } from "@/components/cover-image";
import { AddToLibraryButton } from "@/components/add-to-library-button";
import { getDisplaySubtitle, getDisplayTitle } from "@/lib/media-title";

export const dynamic = "force-dynamic";

export default async function ExternalDetailPage({ params }: { params: Promise<{ source: string; id: string }> }) {
  const { source, id } = await params;
  if (!["anilist", "vndb", "bangumi"].includes(source)) notFound();
  const media = await getExternalMedia(source, id);
  const people = media.mediaType === "ANIME" ? media.studios : media.developers;
  const displayTitle = getDisplayTitle(media);
  const displaySubtitle = getDisplaySubtitle(media);
  const sourceLabel = source === "anilist" ? "AniList" : source === "vndb" ? "VNDB" : "Bangumi";

  return (
    <div className="space-y-6">
      <Link href="/search" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="size-4" />返回搜索</Link>
      <section className="surface relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 overflow-hidden">
          {media.bannerUrl && <CoverImage src={media.bannerUrl} alt="" className="size-full opacity-25 blur-sm" />}
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative flex flex-col gap-7 p-5 pt-12 sm:flex-row sm:p-8 sm:pt-20">
          <div className="media-card-cover relative aspect-[2/3] w-44 shrink-0 self-center overflow-hidden rounded-2xl sm:self-start">
            <CoverImage src={media.coverUrl} alt={displayTitle} className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 self-end">
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="badge-accent rounded-full px-2.5 py-1">{media.mediaType === "ANIME" ? "Anime" : "Galgame"}</span>
              {media.format && <span className="badge rounded-full px-2.5 py-1">{media.format}</span>}
              {media.status && <span className="badge rounded-full px-2.5 py-1">{media.status}</span>}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{displayTitle}</h1>
            {displaySubtitle && <p className="mt-2 text-slate-400">{displaySubtitle}</p>}
            <div className="mt-5"><AddToLibraryButton source={source as "anilist" | "vndb" | "bangumi"} externalId={id} /></div>
          </div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="surface p-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">External metadata</p>
          <h2 className="mt-2 text-xl font-semibold">作品资料</h2>
          <p className="mt-5 whitespace-pre-line leading-7 text-slate-400">{media.description || "暂无简介。"}</p>
          {media.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{media.tags.map((tag) => <span key={tag} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400">{tag}</span>)}</div>}
        </section>
        <aside className="surface h-fit p-6">
          <h2 className="font-semibold">基本信息</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <Info icon={CalendarDays} label="日期" value={media.releaseDate} />
            <Info icon={Users} label={media.mediaType === "ANIME" ? "Studio" : "开发商"} value={people.join("、")} />
            <Info icon={Clock3} label="长度" value={media.episodes ? `${media.episodes} 集${media.episodeDuration ? ` · ${media.episodeDuration} 分钟/集` : ""}` : media.lengthMinutes ? `约 ${Math.round(media.lengthMinutes / 60)} 小时` : null} />
            <Info icon={Monitor} label="平台" value={media.platforms.join(" / ")} />
            <Info icon={Languages} label="语言" value={media.languages.join(" / ")} />
          </dl>
          <p className="mt-6 border-t border-white/8 pt-4 text-xs leading-5 text-slate-600">资料来源：{sourceLabel} · {id}</p>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string | null | undefined }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-slate-600" /><div><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-0.5 text-slate-300">{value || "—"}</dd></div></div>;
}
