"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/backup/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: await file.text() });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "导入失败。");
      setMessage(`导入完成：新增 ${payload.imported} 条，更新 ${payload.updated} 条。`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败。"); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }
  return <div className="flex flex-wrap items-center gap-2"><a href="/api/backup/export" className="button-secondary text-sm"><Download className="size-4" />导出 JSON</a><input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} /><button className="button-secondary text-sm" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}导入 JSON</button>{message && <span className={`w-full text-xs ${message.startsWith("导入完成") ? "text-emerald-300" : "text-rose-300"}`}>{message}</span>}</div>;
}
