import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { AuthForm } from "@/components/auth-form";
import { getAdminPrincipal } from "@/lib/auth/admin-authorization";
import { isAdminRole } from "@/lib/auth/roles";

export const metadata = { title: "管理员登录" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const principal = await getAdminPrincipal();
  if (principal && isAdminRole(principal.role)) redirect("/admin");

  return <div className="grid min-h-[calc(100vh-10rem)] place-items-center py-8">
    {principal ? <div className="surface w-full max-w-md p-7 text-center">
      <ShieldX className="mx-auto size-10 text-rose-300" />
      <h1 className="mt-4 text-2xl font-semibold">无管理员权限</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">当前账号是普通用户，不能进入管理员后台。账号的普通收藏功能不受影响。</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="button-secondary">返回网站</Link><AdminSignOutButton /></div>
    </div> : <Suspense><AuthForm allowRegistration={false} defaultCallbackURL="/admin" heading="管理员登录" /></Suspense>}
  </div>;
}
