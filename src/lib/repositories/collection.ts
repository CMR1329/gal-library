import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { db } from "@/lib/db";
import type { NormalizedMedia } from "@/lib/domain/media";

function metadataPayload(media: NormalizedMedia) {
  const { raw: _raw, ...metadata } = media;
  return JSON.stringify(metadata);
}

function externalReferences(media: NormalizedMedia) {
  if (media.source === "manual") return [];
  const all = [{ source: media.source, externalId: media.externalId }, ...media.externalReferences];
  return all.filter((ref, index) => all.findIndex((candidate) => candidate.source === ref.source && candidate.externalId === ref.externalId) === index);
}

export async function addMediaToCollection(userId: string, media: NormalizedMedia) {
  return db.$transaction(async (tx) => {
    const references = externalReferences(media);
    let common = await tx.media.findFirst({
      where: {
        OR: [
          { externalMetadata: { source: media.source, externalId: media.externalId } },
          ...references.map((reference) => ({ externalReferences: { some: reference } })),
        ],
      },
    });
    if (!common) {
      common = await tx.media.create({
        data: {
          mediaType: media.mediaType,
          title: media.title,
          titleCn: media.titleCn,
          titleCnSource: media.titleCnSource || null,
          originalTitle: media.originalTitle,
          alternateTitles: JSON.stringify(media.alternateTitles),
          coverUrl: media.coverUrl,
          bannerUrl: media.bannerUrl,
          description: media.description,
          releaseDate: media.releaseDate,
          endDate: media.endDate,
          releaseYear: media.releaseYear,
          externalMetadata: {
            create: {
              source: media.source,
              externalId: media.externalId,
              metadataJson: metadataPayload(media),
              rawJson: JSON.stringify(media.raw),
            },
          },
          externalReferences: references.length ? { create: references } : undefined,
        },
      });
    } else {
      await tx.media.update({
        where: { id: common.id },
        data: {
          titleCn: common.titleCn || media.titleCn,
          titleCnSource: common.titleCnSource || media.titleCnSource || null,
          alternateTitles: JSON.stringify([...new Set([
            ...JSON.parse(common.alternateTitles || "[]"),
            ...media.alternateTitles,
            media.title,
            media.originalTitle,
          ].filter(Boolean))]),
        },
      });
      for (const reference of references) {
        await tx.externalReference.upsert({
          where: { source_externalId: reference },
          update: {},
          create: { mediaId: common.id, ...reference },
        });
      }
    }

    const existing = await tx.userEntry.findUnique({ where: { userId_mediaId: { userId, mediaId: common.id } } });
    if (existing) return { entry: existing, created: false };
    const entry = await tx.userEntry.create({
      data: {
        userId,
        mediaId: common.id,
        progressTotal: media.mediaType === "ANIME" ? media.episodes : null,
      },
    });
    return { entry, created: true };
  });
}

export type UpdateEntryInput = {
  status?: string;
  score?: number | null;
  progressCurrent?: number | null;
  progressTotal?: number | null;
  progressText?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  activityYear?: number | null;
  rewatchCount?: number;
  plannedRewatch?: boolean;
  playtimeMinutes?: number | null;
  completedAllRoutes?: boolean;
  notes?: string | null;
  tags?: string[];
  routes?: Array<{ name: string; completed: boolean; completedAt?: string | null; notes?: string | null }>;
};

export async function updateUserEntry(userId: string, mediaId: string, input: UpdateEntryInput) {
  return db.$transaction(async (tx) => {
    const entry = await tx.userEntry.findUnique({ where: { userId_mediaId: { userId, mediaId } } });
    if (!entry) throw new Error("没有找到这条收藏记录。");

    const { tags, routes, ...record } = input;
    await tx.userEntry.update({ where: { id: entry.id }, data: record });

    if (tags) {
      await tx.userEntryTag.deleteMany({ where: { userEntryId: entry.id } });
      for (const name of [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]) {
        const tag = await tx.tag.upsert({
          where: { userId_name: { userId, name } },
          update: {},
          create: { userId, name },
        });
        await tx.userEntryTag.create({ data: { userEntryId: entry.id, tagId: tag.id } });
      }
    }

    if (routes) {
      await tx.routeProgress.deleteMany({ where: { userEntryId: entry.id } });
      const uniqueRoutes = routes.filter((route, index, array) => route.name.trim() && array.findIndex((other) => other.name.trim() === route.name.trim()) === index);
      if (uniqueRoutes.length) {
        await tx.routeProgress.createMany({
          data: uniqueRoutes.map((route, index) => ({
            userEntryId: entry.id,
            name: route.name.trim(),
            completed: route.completed,
            completedAt: route.completedAt || null,
            notes: route.notes || null,
            sortOrder: index,
          })),
        });
      }
    }

    return tx.userEntry.findUnique({
      where: { id: entry.id },
      include: { tags: { include: { tag: true } }, routes: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

export async function updateExternalMedia(mediaId: string, media: NormalizedMedia) {
  return db.$transaction(async (tx) => {
    await tx.media.update({
      where: { id: mediaId },
      data: {
        title: media.title,
        titleCn: media.titleCn,
        titleCnSource: media.titleCnSource || null,
        originalTitle: media.originalTitle,
        alternateTitles: JSON.stringify(media.alternateTitles),
        coverUrl: media.coverUrl,
        bannerUrl: media.bannerUrl,
        description: media.description,
        releaseDate: media.releaseDate,
        endDate: media.endDate,
        releaseYear: media.releaseYear,
      },
    });
    await tx.externalMetadata.update({
      where: { mediaId },
      data: { metadataJson: metadataPayload(media), rawJson: JSON.stringify(media.raw), syncedAt: new Date() },
    });
    for (const reference of externalReferences(media)) {
      await tx.externalReference.upsert({
        where: { source_externalId: reference },
        update: {},
        create: { mediaId, ...reference },
      });
    }
  });
}

export async function deleteUserEntry(userId: string, mediaId: string) {
  return db.userEntry.deleteMany({ where: { userId, mediaId } });
}

const backupReferenceSchema = z.object({
  source: z.string().trim().min(1).max(32),
  externalId: z.string().trim().min(1).max(128),
});

const backupEntrySchema = z.object({
  status: z.string().max(32).optional(),
  score: z.number().finite().nullable().optional(),
  progressCurrent: z.number().int().min(0).max(1_000_000).nullable().optional(),
  progressTotal: z.number().int().min(0).max(1_000_000).nullable().optional(),
  progressText: z.string().max(10_000).nullable().optional(),
  startedAt: z.string().max(64).nullable().optional(),
  completedAt: z.string().max(64).nullable().optional(),
  activityYear: z.number().int().min(0).max(10_000).nullable().optional(),
  rewatchCount: z.number().int().min(0).max(1_000_000).optional(),
  plannedRewatch: z.boolean().optional(),
  playtimeMinutes: z.number().int().min(0).max(100_000_000).nullable().optional(),
  completedAllRoutes: z.boolean().optional(),
  notes: z.string().max(1_000_000).nullable().optional(),
  customDataJson: z.string().max(1_000_000).optional(),
  media: z.object({
    mediaType: z.enum(["ANIME", "VISUAL_NOVEL"]),
    title: z.string().trim().min(1).max(500),
    titleCn: z.string().max(500).nullable().optional(),
    titleCnSource: z.string().max(32).nullable().optional(),
    originalTitle: z.string().max(500).nullable().optional(),
    alternateTitles: z.string().max(20_000).optional(),
    coverUrl: z.string().max(2_000_000).nullable().optional(),
    bannerUrl: z.string().max(2_000_000).nullable().optional(),
    description: z.string().max(2_000_000).nullable().optional(),
    releaseDate: z.string().max(64).nullable().optional(),
    endDate: z.string().max(64).nullable().optional(),
    releaseYear: z.number().int().min(0).max(10_000).nullable().optional(),
    externalMetadata: z.object({
      source: z.string().trim().min(1).max(32),
      externalId: z.string().trim().min(1).max(128),
      schemaVersion: z.number().int().min(1).max(100).optional(),
      metadataJson: z.string().max(2_000_000).optional(),
      rawJson: z.string().max(5_000_000).nullable().optional(),
    }).nullable().optional(),
    externalReferences: z.array(backupReferenceSchema).max(100).optional(),
  }),
  tags: z.array(z.object({ tag: z.object({ name: z.string().trim().min(1).max(100) }).optional() })).max(100).optional(),
  routes: z.array(z.object({ name: z.string().trim().min(1).max(200), completed: z.boolean().optional(), completedAt: z.string().max(64).nullable().optional(), notes: z.string().max(100_000).nullable().optional() })).max(200).optional(),
}).passthrough();

const backupPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().max(100),
  entries: z.array(backupEntrySchema).max(2_000),
});

export type BackupPayload = { version: 1; exportedAt: string; entries: unknown[] };

export async function exportUserCollection(userId: string): Promise<BackupPayload> {
  const entries = await db.userEntry.findMany({
    where: { userId },
    include: {
      media: { include: { externalMetadata: true, externalReferences: true } },
      tags: { include: { tag: true } },
      routes: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { addedAt: "asc" },
  });
  return { version: 1, exportedAt: new Date().toISOString(), entries };
}

export async function importUserCollection(userId: string, payload: BackupPayload) {
  const validated = backupPayloadSchema.safeParse(payload);
  if (!validated.success) throw new Error("备份文件格式无效或包含超出限制的数据。");
  const safePayload = validated.data;
  let imported = 0;
  let updated = 0;
  for (const item of safePayload.entries) {
    const ext = item.media?.externalMetadata;
    if (!item.media?.title || !ext?.source || !ext?.externalId) continue;
    await db.$transaction(async (tx) => {
      const importedReferences = Array.isArray(item.media.externalReferences) ? item.media.externalReferences : [];
      let media = await tx.media.findFirst({
        where: {
          OR: [
            { externalMetadata: { source: ext.source, externalId: ext.externalId } },
            ...importedReferences.filter((ref) => ref.source && ref.externalId).map((ref) => ({ externalReferences: { some: { source: ref.source, externalId: ref.externalId } } })),
          ],
        },
      });
      if (!media) {
        media = await tx.media.create({
          data: {
            mediaType: item.media.mediaType,
            title: item.media.title,
            titleCn: item.media.titleCn,
            titleCnSource: item.media.titleCnSource ?? null,
            originalTitle: item.media.originalTitle,
            alternateTitles: item.media.alternateTitles ?? "[]",
            coverUrl: item.media.coverUrl,
            bannerUrl: item.media.bannerUrl,
            description: item.media.description,
            releaseDate: item.media.releaseDate,
            endDate: item.media.endDate,
            releaseYear: item.media.releaseYear,
            externalMetadata: { create: { source: ext.source, externalId: ext.externalId, schemaVersion: ext.schemaVersion ?? 1, metadataJson: ext.metadataJson ?? "{}", rawJson: ext.rawJson } },
            externalReferences: importedReferences.length ? { create: importedReferences.map((ref) => ({ source: ref.source, externalId: ref.externalId })) } : undefined,
          },
        });
      }
      const old = await tx.userEntry.findUnique({ where: { userId_mediaId: { userId, mediaId: media.id } } });
      const entryData = {
        status: item.status ?? "PLANNED", score: item.score, progressCurrent: item.progressCurrent,
        progressTotal: item.progressTotal, progressText: item.progressText, startedAt: item.startedAt,
        completedAt: item.completedAt, activityYear: item.activityYear ?? null, rewatchCount: item.rewatchCount ?? 0, plannedRewatch: item.plannedRewatch ?? false,
        playtimeMinutes: item.playtimeMinutes, completedAllRoutes: item.completedAllRoutes ?? false,
        notes: item.notes, customDataJson: item.customDataJson ?? "{}",
      };
      const entry = await tx.userEntry.upsert({
        where: { userId_mediaId: { userId, mediaId: media.id } },
        update: entryData,
        create: { userId, mediaId: media.id, ...entryData },
      });
      await tx.userEntryTag.deleteMany({ where: { userEntryId: entry.id } });
      for (const tagItem of item.tags ?? []) {
        const name = tagItem.tag?.name?.trim();
        if (!name) continue;
        const tag = await tx.tag.upsert({ where: { userId_name: { userId, name } }, update: {}, create: { userId, name } });
        await tx.userEntryTag.create({ data: { userEntryId: entry.id, tagId: tag.id } });
      }
      await tx.routeProgress.deleteMany({ where: { userEntryId: entry.id } });
       if (item.routes?.length) await tx.routeProgress.createMany({ data: item.routes.map((route, index) => ({ userEntryId: entry.id, name: route.name, completed: !!route.completed, completedAt: route.completedAt, notes: route.notes, sortOrder: index })) });
      if (old) updated += 1; else imported += 1;
    });
  }
  return { imported, updated };
}

export function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
