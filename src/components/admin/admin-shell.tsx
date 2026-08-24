import Link from "next/link";
import { Gauge, Settings, ShieldCheck, Users } from "lucide-react";
import type { AdminPrincipal } from "@/lib/auth/admin-authorization";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { AdminSignOutButton } from "./admin-sign-out-button";

export function AdminShell({ principal, children }: { principal: AdminPrincipal; children: React.ReactNode }) {
  const links = [
    { href: "/admin", label: "Dashboard", icon: Gauge, visible: true },
    { href: "/admin/users", label: "用户管理", icon: Users, visible: true },
    { href: "/admin/permissions", label: "权限管理", icon: ShieldCheck, visible: principal.role === "super_admin" },
    { href: "/admin/settings", label: "网站设置", icon: Settings, visible: principal.role === "super_admin" },
  ];
  const username = principal.username || principal.name || principal.email || principal.id;

  return <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
    <aside className="surface h-fit p-4 lg:sticky lg:top-24">
      <div className="border-b border-white/8 pb-4">
        <p className="truncate font-semibold text-white">{username}</p>
        <p className="mt-1 text-sm text-violet-300">{ROLE_LABELS[principal.role]}</p>
      </div>
      <nav className="mt-4 grid gap-1">
        {links.filter((item) => item.visible).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-link"><Icon className="size-4" />{label}</Link>)}
      </nav>
      <div className="mt-4"><AdminSignOutButton /></div>
    </aside>
    <section className="min-w-0">{children}</section>
  </div>;
}
