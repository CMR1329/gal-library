import Link from "next/link";
import { ArrowRight, BookOpen, Gamepad2, LibraryBig, Sparkles } from "lucide-react";
import { getCurrentSession } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { MediaCard } from "@/components/media-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) return <PublicHome />;
  const userId = session.user.id;
  const [animeCount, animeCompleted, vnCount, vnCompleted, inProgress, recentlyCompleted, recentlyAdded] = await Promise.all([
    db.userEntry.count({ where: { userId, media: { mediaType: "ANIME" } } }),
    db.userEntry.count({ where: { userId, status: "COMPLETED", media: { mediaType: "ANIME" } } }),
    db.userEntry.count({ where: { userId, media: { mediaType: "VISUAL_NOVEL" } } }),
    db.userEntry.count({ where: { userId, status: "COMPLETED", media: { mediaType: "VISUAL_NOVEL" } } }),
    db.userEntry.findMany({ where: { userId, status: "IN_PROGRESS" }, include: { media: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
    db.userEntry.findMany({ where: { userId, status: "COMPLETED" }, include: { media: true }, orderBy: { completedAt: { sort: "desc", nulls: "last" } }, take: 6 }),
    db.userEntry.findMany({ where: { userId }, include: { media: true }, orderBy: { addedAt: "desc" }, take: 6 }),
  ]);

  const stats = [
    { label: "Anime 收藏", value: animeCount, icon: BookOpen, color: "text-violet-300" },
    { label: "Anime 完成", value: animeCompleted, icon: Sparkles, color: "text-cyan-300" },
    { label: "Galgame 收藏", value: vnCount, icon: Gamepad2, color: "text-pink-300" },
    { label: "Galgame 完成", value: vnCompleted, icon: LibraryBig, color: "text-amber-300" },
  ];

  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121725] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-violet-300">Your quiet archive</p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">把喜欢的故事，<br />留在自己的书架上。</h1>
          <p className="mt-5 max-w-xl leading-7 text-slate-400">从 Bangumi、AniList 与 VNDB 搜索作品，收藏、评分并记录每一段观看与游玩进度，记录成为老资历之路</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search" className="button-primary">搜索作品 <ArrowRight className="size-4" /></Link>
            <Link href="/library" className="button-secondary">浏览收藏库</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="text-sm text-slate-500">Library overview</p><h2 className="mt-1 text-2xl font-semibold">收藏概览</h2></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="surface p-5">
              <Icon className={`size-5 ${color}`} />
              <p className="mt-5 text-3xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <DashboardShelf title="正在进行" subtitle="Continue" entries={inProgress} empty="目前没有正在进行的作品" />
      <DashboardShelf title="最近完成" subtitle="Finished" entries={recentlyCompleted} empty="完成作品后会显示在这里" />
      <DashboardShelf title="最近添加" subtitle="New to library" entries={recentlyAdded} empty="收藏第一部作品，开始建立你的书架" />
    </div>
  );
}

function PublicHome() {
  return <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121725] px-6 py-14 sm:px-10 sm:py-20"><div className="absolute -right-24 -top-24 size-80 rounded-full bg-violet-500/15 blur-3xl" /><div className="relative max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-violet-300">Your quiet archive</p><h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">一起成为<br />动漫/galgame高手</h1><p className="mt-5 max-w-xl leading-7 text-slate-400">从 Bangumi、AniList 与 VNDB 搜索作品，收藏、评分并记录每一段观看与游玩进度，记录成为老资历之路</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="button-primary">登录或注册 <ArrowRight className="size-4" /></Link><Link href="/search" className="button-secondary">先浏览搜索</Link></div></div></section>;
}

function DashboardShelf({ title, subtitle, entries, empty }: { title: string; subtitle: string; entries: any[]; empty: string }) {
  return <section><div className="mb-4 flex items-end justify-between"><div><p className="text-sm text-slate-500">{subtitle}</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2></div>{entries.length > 0 && <Link href="/library" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-violet-200">查看全部</Link>}</div>{entries.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{entries.map(entry => <MediaCard key={entry.id} entry={entry} />)}</div> : <div className="surface border-dashed p-8 text-center text-sm text-slate-600">{empty}</div>}</section>;
}
