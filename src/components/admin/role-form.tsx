"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck, ShieldX } from "lucide-react";

export function RoleForm({ userId, currentRole }: { userId: string; currentRole: "user" | "admin" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const nextRole = currentRole === "user" ? "admin" : "user";

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "权限修改失败。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "权限修改失败。");
    } finally {
      setBusy(false);
    }
  }

  const Icon = currentRole === "user" ? ShieldCheck : ShieldX;
  return <div className="flex flex-col items-end gap-1">
    <button type="button" disabled={busy} onClick={submit} className={currentRole === "user" ? "button-primary" : "button-secondary"}>
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {currentRole === "user" ? "设为管理员" : "移除管理员"}
    </button>
    {message && <span className="max-w-64 text-right text-xs text-rose-300">{message}</span>}
  </div>;
}
