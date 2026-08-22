import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { apiError } from "@/lib/http";
import { addMediaToCollection } from "@/lib/repositories/collection";

const schema = z.object({
  mediaType: z.enum(["ANIME", "VISUAL_NOVEL"]),
  title: z.string().trim().min(1).max(300),
  originalTitle: z.string().trim().max(300).optional().default(""),
  coverUrl: z.union([z.string().url(), z.literal("")]).optional().default(""),
  description: z.string().max(20000).optional().default(""),
  releaseDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const userId = await getCurrentUserId();
    const result = await addMediaToCollection(userId, {
      source: "manual",
      externalId: `manual-${randomUUID()}`,
      mediaType: body.mediaType,
      title: body.title,
      titleCn: /\p{Script=Han}/u.test(body.title) ? body.title : null,
      titleCnSource: /\p{Script=Han}/u.test(body.title) ? "manual" : null,
      originalTitle: body.originalTitle || null,
      alternateTitles: [],
      coverUrl: body.coverUrl || null,
      bannerUrl: null,
      description: body.description || null,
      releaseDate: body.releaseDate || null,
      endDate: null,
      releaseYear: body.releaseDate ? Number(body.releaseDate.slice(0, 4)) : null,
      format: body.mediaType === "ANIME" ? "Manual Anime" : "Manual Visual Novel",
      status: null, genres: [], tags: [], studios: [], developers: [], publishers: [], platforms: [], languages: [],
      episodes: null, episodeDuration: null, lengthMinutes: null, season: null, relations: [], externalReferences: [], raw: { manual: true },
    });
    return NextResponse.json({ mediaId: result.entry.mediaId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
