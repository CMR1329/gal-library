import { notFound } from "next/navigation";
import { getSuperAdminUserCollections } from "@/lib/admin/data";
import { getStatusLabel, MEDIA_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "用户收藏" };

export default async function AdminUserCollectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, entries } = await getSuperAdminUserCollections(id);
  if (!user) notFound();
  const formatDate = (value: Date) => new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(value);
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">Sensitive collection view</p><h1 className="mt-2 text-3xl font-semibold">{user.username || user.displayName || user.name || "用户"}的收藏</h1><p className="mt-2 text-sm text-slate-500">私密主页的访问会写入管理员操作日志。</p></div>
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/8 text-slate-500"><tr><th className="p-4">作品名称</th><th className="p-4">类型</th><th className="p-4">状态</th><th className="p-4">评分</th><th className="p-4">添加时间</th></tr></thead><tbody>
        {entries.map((entry) => <tr key={entry.id} className="border-b border-white/8 last:border-0"><td className="p-4 font-medium">{entry.media.titleCn || entry.media.title}</td><td className="p-4 text-slate-400">{MEDIA_TYPE_LABELS[entry.media.mediaType] || entry.media.mediaType}</td><td className="p-4">{getStatusLabel(entry.status, entry.media.mediaType)}</td><td className="p-4">{entry.score ?? "—"}</td><td className="p-4 text-slate-400">{formatDate(entry.addedAt)}</td></tr>)}
        {!entries.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">该用户暂无收藏记录。</td></tr>}
      </tbody></table>
    </div>
  </div>;
}
