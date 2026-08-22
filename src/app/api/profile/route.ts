import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { db } from "@/lib/db";

const profileSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/, "用户名只能包含字母、数字、下划线或短横线。"),
  avatarUrl: z.string().trim().max(2_000_000).refine((value) => value === "" || /^https?:\/\//i.test(value) || /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value), "头像需要使用图片 URL 或图片文件。"),
  profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
});

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const input = profileSchema.parse(await request.json());
    const existing = await db.user.findFirst({ where: { username: input.username, NOT: { id: userId } }, select: { id: true } });
    if (existing) return Response.json({ error: "这个用户名已经被使用。" }, { status: 409 });
    const avatarUrl = input.avatarUrl || null;
    const user = await db.user.update({ where: { id: userId }, data: { username: input.username, avatarUrl, image: avatarUrl, profileVisibility: input.profileVisibility }, select: { username: true, avatarUrl: true, image: true, profileVisibility: true } });
    return Response.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message || "资料格式不正确。" }, { status: 400 });
    return Response.json({ error: "保存个人资料失败，请稍后重试。" }, { status: 500 });
  }
}
