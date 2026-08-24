import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryBig } from "lucide-react";
import { getAdminUserDetail } from "@/lib/admin/data";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata = { title: "用户详情" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { principal, user } = await getAdminUserDetail(id);
  if (!user) notFound();
  const registeredAt = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(user.createdAt);
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">User detail</p><h1 className="mt-2 text-3xl font-semibold">{user.username || user.displayName || user.name || "未设置用户名"}</h1></div>
    <section className="surface grid gap-4 p-6 sm:grid-cols-2">
      <div><p className="text-xs text-slate-500">邮箱</p><p className="mt-1">{user.email || "—"}</p></div>
      <div><p className="text-xs text-slate-500">角色</p><p className="mt-1">{ROLE_LABELS[user.role]}</p></div>
      <div><p className="text-xs text-slate-500">注册时间</p><p className="mt-1">{registeredAt}</p></div>
      <div><p className="text-xs text-slate-500">主页可见性</p><p className="mt-1">{user.profileVisibility === "PUBLIC" ? "公开" : "私密"}</p></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="surface p-5"><p className="text-2xl font-semibold">{user.animeCount}</p><p className="mt-1 text-sm text-slate-500">Anime 收藏</p></div>
      <div className="surface p-5"><p className="text-2xl font-semibold">{user.galgameCount}</p><p className="mt-1 text-sm text-slate-500">Galgame 收藏</p></div>
      <div className="surface p-5"><p className="text-2xl font-semibold">{user.totalCount}</p><p className="mt-1 text-sm text-slate-500">总收藏</p></div>
    </section>
    {principal.role === "super_admin" && <Link prefetch={false} href={`/admin/users/${encodeURIComponent(user.id)}/collections`} className="button-primary"><LibraryBig className="size-4" />查看具体收藏</Link>}
  </div>;
}
