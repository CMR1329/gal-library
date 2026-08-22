import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getExternalMedia } from "@/lib/adapters";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { apiError } from "@/lib/http";
import { addMediaToCollection } from "@/lib/repositories/collection";

const addSchema = z.object({ source: z.enum(["anilist", "vndb", "bangumi"]), externalId: z.string().min(1).max(32) });

export async function POST(request: NextRequest) {
  try {
    const body = addSchema.parse(await request.json());
    const userId = await getCurrentUserId();
    const media = await getExternalMedia(body.source, body.externalId);
    const result = await addMediaToCollection(userId, media);
    return NextResponse.json({ mediaId: result.entry.mediaId, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
