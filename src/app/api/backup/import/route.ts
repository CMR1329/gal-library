import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { apiError } from "@/lib/http";
import { importUserCollection, type BackupPayload } from "@/lib/repositories/collection";

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ error: "备份文件必须是 JSON。" }, { status: 415 });
    }
    const text = await request.text();
    if (text.length > 25_000_000) return NextResponse.json({ error: "备份文件过大。" }, { status: 413 });
    const payload = JSON.parse(text) as BackupPayload;
    const result = await importUserCollection(await getCurrentUserId(), payload);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
