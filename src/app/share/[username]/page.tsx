import { notFound } from "next/navigation";
import { ProfileShowcase } from "@/components/profile-showcase";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/current-user";
import { getProfileCollection, profileFilters, profileUserSelect } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

type Params = { type?: string; status?: string };

export default async function SharedProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<Params> }) {
  const [{ username }, filters] = await Promise.all([params, searchParams]);
  const decodedUsername = decodeURIComponent(username);
  const user = await db.user.findUnique({ where: { username: decodedUsername }, select: profileUserSelect });
  if (!user) notFound();
  const session = await getCurrentSession();
  if (user.profileVisibility !== "PUBLIC" && session?.user?.id !== user.id) notFound();

  const { selectedType, selectedStatus } = profileFilters(filters.type, filters.status);
  const { entries, allEntries } = await getProfileCollection(user.id, selectedType, selectedStatus);
  const profilePath = `/share/${encodeURIComponent(user.username || decodedUsername)}`;

  return <ProfileShowcase user={user} entries={entries} allEntries={allEntries} selectedType={selectedType} selectedStatus={selectedStatus} profilePath={profilePath} />;
}
