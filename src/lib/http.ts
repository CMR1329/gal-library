import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { ExternalApiError } from "@/lib/adapters/errors";
import { AuthenticationError } from "@/lib/auth/current-user";

export function apiError(error: unknown) {
  console.error(error);
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ExternalApiError) {
    return NextResponse.json({ error: error.message, retryAfter: error.retryAfter ?? undefined }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return NextResponse.json({ error: "这部作品已经在收藏库中。" }, { status: 409 });
    return NextResponse.json({ error: "保存本地数据时出现问题，请稍后重试。" }, { status: 500 });
  }
  if (error instanceof Error && error.message) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: "发生了未知错误，请稍后重试。" }, { status: 500 });
}
