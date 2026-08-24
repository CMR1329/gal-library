import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const SITE_SETTINGS_ID = "global";
export const SITE_SETTINGS_CACHE_TAG = "site-settings";

function allowedBackgroundUrl(value: string | null | undefined) {
  if (!value) return null;
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const bucket = process.env.SUPABASE_BACKGROUND_BUCKET || "site-backgrounds";
  if (!supabaseUrl) return null;
  try {
    const candidate = new URL(value);
    const expected = new URL(supabaseUrl);
    if (candidate.origin !== expected.origin) return null;
    const expectedPath = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
    if (!candidate.pathname.startsWith(expectedPath)) return null;
    return candidate.toString();
  } catch {
    return null;
  }
}

export const getPublicSiteSettings = unstable_cache(
  async () => {
    const settings = await db.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: { backgroundImageUrl: true },
    });
    return { backgroundImageUrl: allowedBackgroundUrl(settings?.backgroundImageUrl) };
  },
  [SITE_SETTINGS_ID],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 300 },
);

export async function getSiteSettingsForAdmin() {
  const settings = await db.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { backgroundImageUrl: true, createdAt: true, updatedAt: true },
  });
  return settings ? { ...settings, backgroundImageUrl: allowedBackgroundUrl(settings.backgroundImageUrl) } : null;
}
