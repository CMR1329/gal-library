import { z } from "zod";
import { AdminMutationError, updateUserRoleAsCurrentSuperAdmin } from "@/lib/admin/mutations";
import { adminApiError } from "@/lib/auth/admin-authorization";

const roleSchema = z.object({ role: z.enum(["user", "admin"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, body] = await Promise.all([params, request.json()]);
    const result = await updateUserRoleAsCurrentSuperAdmin(id, roleSchema.parse(body).role);
    return Response.json({ user: result });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "只能设置 user 或 admin 角色。" }, { status: 400 });
    if (error instanceof AdminMutationError) return Response.json({ error: error.message }, { status: error.status });
    return adminApiError(error);
  }
}
