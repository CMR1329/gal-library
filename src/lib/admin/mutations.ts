import "server-only";

import type { PrismaClient } from "@/generated/prisma";
import { requireSuperAdminApi } from "@/lib/auth/admin-authorization";
import type { UserRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";

type DatabaseClient = Pick<PrismaClient, "$transaction">;

export class AdminMutationError extends Error {
  constructor(public readonly status: 400 | 404 | 409, message: string) {
    super(message);
    this.name = "AdminMutationError";
  }
}

export async function updateUserRole(
  actorUserId: string,
  targetUserId: string,
  nextRole: Extract<UserRole, "user" | "admin">,
  database: DatabaseClient = db,
) {
  return database.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target) throw new AdminMutationError(404, "目标用户不存在。");
    if (target.role === "super_admin") throw new AdminMutationError(409, "不能修改超级管理员权限。");
    if (target.role === nextRole) return { id: target.id, role: nextRole, changed: false };

    const result = await tx.user.updateMany({
      where: { id: target.id, role: { not: "super_admin" } },
      data: { role: nextRole },
    });
    if (result.count !== 1) throw new AdminMutationError(409, "用户权限已发生变化，请刷新后重试。");

    await tx.adminLog.create({
      data: {
        actorUserId,
        action: "UPDATE_USER_ROLE",
        targetType: "User",
        targetId: target.id,
        detailsJson: JSON.stringify({ from: target.role, to: nextRole }),
      },
    });
    return { id: target.id, role: nextRole, changed: true };
  });
}

export async function updateUserRoleAsCurrentSuperAdmin(targetUserId: string, nextRole: "user" | "admin") {
  const principal = await requireSuperAdminApi();
  return updateUserRole(principal.id, targetUserId, nextRole);
}
