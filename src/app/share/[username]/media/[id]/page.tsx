import { notFound } from "next/navigation";
import { ProfileMediaOverview } from "@/components/profile-media-overview";
import { db } from "@/lib/db";
import { profilePublicMediaInclude, profileUserSelect } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

export default async function SharedMediaPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await db.user.findFirst({ where: { username: decodedUsername, profileVisibility: "PUBLIC" }, select: profileUserSelect });
  if (!user) notFound();

  const entry = await db.userEntry.findUnique({ where: { userId_mediaId: { userId: user.id, mediaId: id } }, include: profilePublicMediaInclude });
  if (!entry) notFound();
  const profilePath = `/share/${encodeURIComponent(user.username || decodedUsername)}`;

  return <ProfileMediaOverview entry={entry} profilePath={profilePath} backLabel="返回公开主页" />;
}
