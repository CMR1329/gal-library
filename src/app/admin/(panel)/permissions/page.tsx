import { RoleForm } from "@/components/admin/role-form";
import { getPermissionUsers } from "@/lib/admin/data";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata = { title: "权限管理" };

export default async function AdminPermissionsPage() {
  const { users } = await getPermissionUsers();
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">Permissions</p><h1 className="mt-2 text-3xl font-semibold">权限管理</h1><p className="mt-2 text-sm text-slate-500">只能在普通用户与管理员之间转换；超级管理员不能通过此页面修改。</p></div>
    <div className="space-y-3">
      {users.map((user) => <div key={user.id} className="surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate font-medium">{user.username || user.name || "未设置用户名"}</p><p className="mt-1 truncate text-sm text-slate-500">{user.email || "—"}</p><p className="mt-1 text-xs text-violet-300">{ROLE_LABELS[user.role]}</p></div>{user.role === "super_admin" ? <span className="text-sm text-slate-500">受保护</span> : <RoleForm userId={user.id} currentRole={user.role} />}</div>)}
    </div>
  </div>;
}
