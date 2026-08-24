import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/current-user";
import { isAdminRole, normalizeUserRole, type UserRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";

export type AdminPrincipal = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  role: UserRole;
};

export class AdminAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

export const getAdminPrincipal = cache(async (): Promise<AdminPrincipal | null> => {
  const session = await getCurrentSession();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, name: true, email: true, role: true },
  });
  if (!user) return null;
  return { ...user, role: normalizeUserRole(user.role) };
});

export async function requireAdminPage() {
  const principal = await getAdminPrincipal();
  if (!principal) redirect("/admin/login");
  if (!isAdminRole(principal.role)) redirect("/admin/login?error=forbidden");
  return principal;
}

export async function requireSuperAdminPage() {
  const principal = await requireAdminPage();
  if (principal.role !== "super_admin") redirect("/admin?error=forbidden");
  return principal;
}

export async function requireAdminApi() {
  const principal = await getAdminPrincipal();
  if (!principal) throw new AdminAuthorizationError(401, "请先登录管理员账号。");
  if (!isAdminRole(principal.role)) throw new AdminAuthorizationError(403, "当前账号没有管理员权限。");
  return principal;
}

export async function requireSuperAdminApi() {
  const principal = await requireAdminApi();
  if (principal.role !== "super_admin") throw new AdminAuthorizationError(403, "只有超级管理员可以执行此操作。");
  return principal;
}

export function adminApiError(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "管理员操作失败，请稍后重试。" }, { status: 500 });
}
