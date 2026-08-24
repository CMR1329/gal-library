import Link from "next/link";
import { getAdminUsersData } from "@/lib/admin/data";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata = { title: "用户管理" };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(value);
}

export default async function AdminUsersPage() {
  const { users } = await getAdminUsersData();
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">Users</p><h1 className="mt-2 text-3xl font-semibold">用户管理</h1><p className="mt-2 text-sm text-slate-500">共 {users.length} 位真实注册用户。</p></div>
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-white/8 text-slate-500"><tr><th className="p-4">用户</th><th className="p-4">邮箱</th><th className="p-4">注册时间</th><th className="p-4">角色</th><th className="p-4 text-right">Anime</th><th className="p-4 text-right">Galgame</th><th className="p-4 text-right">总计</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/8 last:border-0"><td className="p-4"><Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="font-medium text-violet-300 hover:underline">{user.username || user.displayName || user.name || "未设置用户名"}</Link></td><td className="p-4 text-slate-400">{user.email || "—"}</td><td className="p-4 text-slate-400">{formatDate(user.createdAt)}</td><td className="p-4">{ROLE_LABELS[user.role]}</td><td className="p-4 text-right">{user.animeCount}</td><td className="p-4 text-right">{user.galgameCount}</td><td className="p-4 text-right font-semibold">{user.totalCount}</td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
