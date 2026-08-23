import Link from "next/link";
import { LibraryBig } from "lucide-react";
import { notFound } from "next/navigation";
import { ProfileShowcase } from "@/components/profile-showcase";
import { ProfileEditor } from "@/components/profile-editor";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/current-user";
import { getProfileCollection, profileFilters, profileUserSelect } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

type Params = { type?: string; status?: string };

export default async function UserProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<Params> }) {
  const [{ username }, filters] = await Promise.all([params, searchParams]);
  const decodedUsername = decodeURIComponent(username);
  const sessionUser = await requirePageUser(`/user/${encodeURIComponent(decodedUsername)}`);
  const user = await db.user.findUnique({ where: { id: sessionUser.id }, select: profileUserSelect });
  if (!user || user.username !== decodedUsername) notFound();

  const { selectedType, selectedStatus } = profileFilters(filters.type, filters.status);
  const { entries, allEntries } = await getProfileCollection(user.id, selectedType, selectedStatus);
  const profilePath = `/user/${encodeURIComponent(user.username)}`;

  return <ProfileShowcase
    user={user}
    entries={entries}
    allEntries={allEntries}
    selectedType={selectedType}
    selectedStatus={selectedStatus}
    profilePath={profilePath}
    managementActions={<><Link href="/library" className="button-secondary"><LibraryBig className="size-4" />管理我的收藏</Link><ProfileEditor initialUsername={user.username} initialAvatarUrl={user.image || user.avatarUrl} initialVisibility={user.profileVisibility === "PUBLIC" ? "PUBLIC" : "PRIVATE"} /></>}
  />;
}
