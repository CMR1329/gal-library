import { notFound } from "next/navigation";
import { ProfileMediaOverview } from "@/components/profile-media-overview";
import { RecordEditor } from "@/components/record-editor";
import { RefreshMetadataButton } from "@/components/refresh-metadata-button";
import { requirePageUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { profileMediaInclude, profileUserSelect } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

export default async function UserMediaPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const decodedUsername = decodeURIComponent(username);
  const sessionUser = await requirePageUser(`/user/${encodeURIComponent(decodedUsername)}/media/${encodeURIComponent(id)}`);
  const user = await db.user.findUnique({ where: { id: sessionUser.id }, select: profileUserSelect });
  if (!user || user.username !== decodedUsername) notFound();

  const entry = await db.userEntry.findUnique({ where: { userId_mediaId: { userId: user.id, mediaId: id } }, include: profileMediaInclude });
  if (!entry) notFound();
  const profilePath = `/user/${encodeURIComponent(user.username)}`;
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

  return <div className="space-y-6">
    <ProfileMediaOverview entry={entry} profilePath={profilePath} backLabel="返回我的主页" actions={entry.media.externalMetadata?.source !== "manual" ? <RefreshMetadataButton mediaId={entry.media.id} /> : null} />
    <section className="surface p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Private record</p><h2 className="mt-2 text-xl font-semibold">我的记录</h2><p className="mt-2 text-sm text-slate-500">以下内容属于当前用户，不会上传到任何外部资料来源。</p><div className="my-6 h-px bg-white/8" /><RecordEditor mediaId={entry.media.id} mediaType={entry.media.mediaType} entry={record} /></section>
  </div>;
}
