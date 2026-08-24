import { BookOpen, Gamepad2, LibraryBig, Users } from "lucide-react";
import { getAdminDashboardData } from "@/lib/admin/data";

export const metadata = { title: "管理员后台" };

export default async function AdminDashboardPage() {
  const { userCount, animeCount, galgameCount, collectionCount } = await getAdminDashboardData();
  const stats = [
    { label: "用户数量", value: userCount, icon: Users },
    { label: "动漫收藏数量", value: animeCount, icon: BookOpen },
    { label: "Galgame 收藏数量", value: galgameCount, icon: Gamepad2 },
    { label: "总收藏记录数量", value: collectionCount, icon: LibraryBig },
  ];
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">Administration</p><h1 className="mt-2 text-3xl font-semibold">网站数据概览</h1><p className="mt-2 text-sm text-slate-500">仅统计业务用户和收藏关系，不读取认证凭据。</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => <div key={label} className="surface p-5"><Icon className="size-5 text-violet-300" /><p className="mt-5 text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>)}
    </div>
  </div>;
}
