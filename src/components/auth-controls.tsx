"use client";

import Link from "next/link";
import { LogIn, LogOut, LoaderCircle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export function AuthControls() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  if (isPending) return <LoaderCircle className="mx-2 size-4 animate-spin text-slate-600" />;
  if (!session) return <Link href="/login" className="nav-link"><LogIn className="size-4" /><span className="hidden sm:inline">登录</span></Link>;
  const profile = session.user as { username?: string | null; image?: string | null; avatarUrl?: string | null; name?: string | null };
  const username = profile.username || profile.name || "我的主页";
  const publicHandle = profile.username;
  const avatar = profile.image || profile.avatarUrl;
  return <div className="flex items-center gap-1">{publicHandle && <Link href={`/user/${encodeURIComponent(publicHandle)}`} className="nav-link max-w-44" title="打开我的主页"><span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-500/15 text-violet-300">{avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt="" className="size-full object-cover" />
  ) : <UserRound className="size-3.5" />}</span><span className="max-w-28 truncate">{username}</span></Link>}<button className="nav-link" title="退出登录" onClick={async () => { await authClient.signOut(); router.push("/login"); router.refresh(); }}><LogOut className="size-4" /><span className="hidden sm:inline">退出</span></button></div>;
}
