import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { ENTRY_STATUSES } from "@/lib/constants";

export const profileUserSelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
  avatarUrl: true,
  profileVisibility: true,
  createdAt: true,
} as const;

export const profileMediaInclude = {
  media: { include: { externalMetadata: true, externalReferences: true } },
  tags: { include: { tag: true } },
  routes: { orderBy: { sortOrder: "asc" } },
} as const satisfies Prisma.UserEntryInclude;

export const profilePublicMediaInclude = {
  media: { include: { externalMetadata: true, externalReferences: true } },
} as const satisfies Prisma.UserEntryInclude;

export type ProfileUser = Prisma.UserGetPayload<{ select: typeof profileUserSelect }>;
export type ProfileEntry = Prisma.UserEntryGetPayload<{ include: { media: true } }>;
export type ProfileMediaEntry = Prisma.UserEntryGetPayload<{ include: typeof profileMediaInclude }>;
export type ProfileMediaOverviewEntry = Prisma.UserEntryGetPayload<{ include: typeof profilePublicMediaInclude }>;
export type ProfileSummaryEntry = { status: string; media: { mediaType: string } };

export function profileFilters(type?: string, status?: string) {
  const selectedType = type === "anime" ? "ANIME" : type === "galgame" ? "VISUAL_NOVEL" : undefined;
  const selectedStatus = status && status in ENTRY_STATUSES ? status : undefined;
  return { selectedType, selectedStatus };
}

export async function getProfileCollection(userId: string, selectedType?: string, selectedStatus?: string) {
  const [entries, allEntries] = await Promise.all([
    db.userEntry.findMany({
      where: {
        userId,
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedType ? { media: { mediaType: selectedType } } : {}),
      },
      include: { media: true },
      orderBy: { addedAt: "desc" },
    }),
    db.userEntry.findMany({
      where: { userId },
      select: { status: true, media: { select: { mediaType: true } } },
    }),
  ]);

  return { entries, allEntries };
}
