import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getExternalMedia } from "@/lib/adapters";
import { apiError } from "@/lib/http";
import { updateExternalMedia } from "@/lib/repositories/collection";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, userId] = await Promise.all([params, getCurrentUserId()]);
    const item = await db.media.findFirst({ where: { id, userEntries: { some: { userId } } }, include: { externalMetadata: true } });
    if (!item) return NextResponse.json({ error: "没有找到这部作品。" }, { status: 404 });
    if (!item.externalMetadata || item.externalMetadata.source === "manual") return NextResponse.json({ error: "手动添加的作品没有外部资料可更新。" }, { status: 400 });
    const media = await getExternalMedia(item.externalMetadata.source, item.externalMetadata.externalId);
    await updateExternalMedia(id, media);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
