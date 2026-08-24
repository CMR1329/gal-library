"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

export function AdminSignOutButton() {
  const router = useRouter();
  return <button
    type="button"
    className="button-secondary"
    onClick={async () => {
      await authClient.signOut();
      router.push("/admin/login");
      router.refresh();
    }}
  ><LogOut className="size-4" />退出登录</button>;
}
