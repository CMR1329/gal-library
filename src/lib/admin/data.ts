import "server-only";

import { requireAdminPage, requireSuperAdminPage } from "@/lib/auth/admin-authorization";
import { normalizeUserRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const safeUserSelect = {
  id: true,
  username: true,
  name: true,
  displayName: true,
  email: true,
  profileVisibility: true,
  role: true,
  createdAt: true,
} as const;

export async function getAdminDashboardData() {
  const principal = await requireAdminPage();
  const [userCount, animeCount, galgameCount, collectionCount] = await Promise.all([
    db.user.count(),
    db.userEntry.count({ where: { media: { mediaType: "ANIME" } } }),
    db.userEntry.count({ where: { media: { mediaType: "VISUAL_NOVEL" } } }),
    db.userEntry.count(),
  ]);
  return { principal, userCount, animeCount, galgameCount, collectionCount };
}

export async function getAdminUsersData() {
  const principal = await requireAdminPage();
  const users = await db.user.findMany({ select: safeUserSelect, orderBy: { createdAt: "desc" } });
  const ids = users.map((user) => user.id);
  const [animeCounts, galgameCounts] = ids.length ? await Promise.all([
    db.userEntry.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, media: { mediaType: "ANIME" } },
      _count: { _all: true },
    }),
    db.userEntry.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, media: { mediaType: "VISUAL_NOVEL" } },
      _count: { _all: true },
    }),
  ]) : [[], []];
  const animeByUser = new Map(animeCounts.map((item) => [item.userId, item._count._all]));
  const galgameByUser = new Map(galgameCounts.map((item) => [item.userId, item._count._all]));

  return {
    principal,
    users: users.map((user) => {
      const animeCount = animeByUser.get(user.id) ?? 0;
      const galgameCount = galgameByUser.get(user.id) ?? 0;
      return { ...user, role: normalizeUserRole(user.role), animeCount, galgameCount, totalCount: animeCount + galgameCount };
    }),
  };
}

export async function getAdminUserDetail(userId: string) {
  const principal = await requireAdminPage();
  const user = await db.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) return { principal, user: null };
  const [animeCount, galgameCount, totalCount] = await Promise.all([
    db.userEntry.count({ where: { userId, media: { mediaType: "ANIME" } } }),
    db.userEntry.count({ where: { userId, media: { mediaType: "VISUAL_NOVEL" } } }),
    db.userEntry.count({ where: { userId } }),
  ]);
  return { principal, user: { ...user, role: normalizeUserRole(user.role), animeCount, galgameCount, totalCount } };
}

export async function getPermissionUsers() {
  const principal = await requireSuperAdminPage();
  const users = await db.user.findMany({
    select: { id: true, username: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return { principal, users: users.map((user) => ({ ...user, role: normalizeUserRole(user.role) })) };
}

export async function getSuperAdminUserCollections(userId: string) {
  const principal = await requireSuperAdminPage();
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: safeUserSelect });
    if (!user) return { principal, user: null, entries: [] };

    if (user.profileVisibility === "PRIVATE") {
      await tx.adminLog.create({
        data: {
          actorUserId: principal.id,
          action: "VIEW_PRIVATE_COLLECTION",
          targetType: "User",
          targetId: user.id,
          detailsJson: JSON.stringify({ profileVisibility: "PRIVATE" }),
        },
      });
    }

    const entries = await tx.userEntry.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        score: true,
        addedAt: true,
        media: { select: { id: true, title: true, titleCn: true, mediaType: true } },
      },
      orderBy: { addedAt: "desc" },
    });
    return { principal, user: { ...user, role: normalizeUserRole(user.role) }, entries };
  });
}
