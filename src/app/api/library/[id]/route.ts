import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { apiError } from "@/lib/http";
import { deleteUserEntry, updateUserEntry } from "@/lib/repositories/collection";

const nullableDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null()]).optional();
const updateSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
  score: z.number().min(0).max(10).refine((value) => Number.isInteger(value * 2), "评分必须以 0.5 为步长").nullable().optional(),
  progressCurrent: z.number().int().min(0).nullable().optional(),
  progressTotal: z.number().int().min(0).nullable().optional(),
  progressText: z.string().max(200).nullable().optional(),
  startedAt: nullableDate,
  completedAt: nullableDate,
  activityYear: z.number().int().min(1900).max(2200).nullable().optional(),
  rewatchCount: z.number().int().min(0).max(999).optional(),
  plannedRewatch: z.boolean().optional(),
  playtimeMinutes: z.number().int().min(0).nullable().optional(),
  completedAllRoutes: z.boolean().optional(),
  notes: z.string().max(20000).nullable().optional(),
  tags: z.array(z.string().max(40)).max(30).optional(),
  routes: z.array(z.object({ name: z.string().max(100), completed: z.boolean(), completedAt: nullableDate, notes: z.string().max(1000).nullable().optional() })).max(100).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, userId, body] = await Promise.all([params, getCurrentUserId(), request.json()]);
    const result = await updateUserEntry(userId, id, updateSchema.parse(body));
    return NextResponse.json({ entry: result });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, userId] = await Promise.all([params, getCurrentUserId()]);
    const result = await deleteUserEntry(userId, id);
    if (!result.count) return NextResponse.json({ error: "没有找到这条收藏记录。" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
