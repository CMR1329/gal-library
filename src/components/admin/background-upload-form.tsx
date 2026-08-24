"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, LoaderCircle } from "lucide-react";

export function BackgroundUploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = event.currentTarget;
      const response = await fetch("/api/admin/settings/background", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "背景图片保存失败。");
      setMessage("背景图片已保存。");
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "背景图片保存失败。");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm text-slate-400">选择图片
      <input className="field mt-2" type="file" name="background" accept="image/jpeg,image/png,image/webp,image/avif" required />
    </label>
    <p className="text-xs leading-5 text-slate-500">支持 JPG、PNG、WebP、AVIF，最大 10 MB。文件上传至 Supabase Storage，数据库仅保存公开 URL。</p>
    {message && <p className="rounded-lg border border-white/8 bg-white/5 p-3 text-sm text-slate-300">{message}</p>}
    <button className="button-primary" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImageUp className="size-4" />}{busy ? "正在上传…" : "上传并保存"}</button>
  </form>;
}
