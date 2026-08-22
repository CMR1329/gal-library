"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";

export function RefreshMetadataButton({ mediaId }: { mediaId: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  async function refresh() { setBusy(true); setMessage(""); try { const response = await fetch(`/api/library/${mediaId}/refresh`, { method: "POST" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "更新失败。"); setMessage("资料已更新"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "更新失败。"); } finally { setBusy(false); } }
  return <div className="flex items-center gap-2"><button onClick={refresh} disabled={busy} className="button-secondary text-sm">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}更新作品资料</button>{message && <span className="text-xs text-slate-500">{message}</span>}</div>;
}
