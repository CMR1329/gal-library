import { revalidateTag } from "next/cache";
import { requireSuperAdminApi, adminApiError } from "@/lib/auth/admin-authorization";
import { db } from "@/lib/db";
import { SITE_SETTINGS_CACHE_TAG, SITE_SETTINGS_ID } from "@/lib/site-settings";
import { BackgroundFileError, deleteManagedBackground, StorageConfigurationError, uploadBackgroundImage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let uploadedUrl: string | null = null;
  let committed = false;
  try {
    const principal = await requireSuperAdminApi();
    const formData = await request.formData();
    const file = formData.get("background");
    if (!(file instanceof File)) return Response.json({ error: "请选择背景图片。" }, { status: 400 });

    const upload = await uploadBackgroundImage(file);
    uploadedUrl = upload.publicUrl;
    const result = await db.$transaction(async (tx) => {
      const previous = await tx.siteSettings.findUnique({
        where: { id: SITE_SETTINGS_ID },
        select: { backgroundImageUrl: true },
      });
      const updated = await tx.siteSettings.upsert({
        where: { id: SITE_SETTINGS_ID },
        create: { id: SITE_SETTINGS_ID, backgroundImageUrl: upload.publicUrl },
        update: { backgroundImageUrl: upload.publicUrl },
        select: { backgroundImageUrl: true, updatedAt: true },
      });
      await tx.adminLog.create({
        data: {
          actorUserId: principal.id,
          action: "UPDATE_SITE_SETTINGS",
          targetType: "SiteSettings",
          targetId: SITE_SETTINGS_ID,
          detailsJson: JSON.stringify({ field: "backgroundImageUrl", from: previous?.backgroundImageUrl ?? null, to: upload.publicUrl }),
        },
      });
      return { settings: updated, previousUrl: previous?.backgroundImageUrl ?? null };
    });
    committed = true;

    revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
    if (result.previousUrl && result.previousUrl !== upload.publicUrl) {
      await deleteManagedBackground(result.previousUrl).catch(() => undefined);
    }
    return Response.json({ settings: result.settings });
  } catch (error) {
    if (uploadedUrl && !committed) await deleteManagedBackground(uploadedUrl).catch(() => undefined);
    if (error instanceof BackgroundFileError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof StorageConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    return adminApiError(error);
  }
}
