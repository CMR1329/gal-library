"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryBig, LoaderCircle } from "lucide-react";

export function AddToLibraryButton({ source, externalId }: { source: "anilist" | "vndb" | "bangumi"; externalId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function add() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, externalId }) });
      const payload = await response.json();
      if (response.status === 401) { router.push(`/login?callbackURL=${encodeURIComponent(location.pathname)}`); return; }
      if (!response.ok) throw new Error(payload.error || "加入收藏失败。");
      router.push(`/media/${payload.mediaId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加入收藏失败。");
    } finally { setLoading(false); }
  }

  return <div><button onClick={add} disabled={loading} className="button-primary w-full sm:w-auto">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <LibraryBig className="size-4" />}{loading ? "正在保存…" : "加入收藏"}</button>{message && <p className="mt-2 text-sm text-rose-300">{message}</p>}</div>;
}
