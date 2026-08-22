"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

export function ManualForm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "添加失败。");
      router.push(`/media/${payload.mediaId}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "添加失败。"); }
    finally { setBusy(false); }
  }
  return <section className="surface overflow-hidden"><button className="flex w-full items-center justify-between p-5 text-left" onClick={() => setOpen(!open)}><span><span className="font-medium">没有搜到？手动添加作品</span><span className="mt-1 block text-sm text-slate-500">私人收藏不受第三方数据库覆盖率限制</span></span>{open ? <ChevronUp /> : <ChevronDown />}</button>{open && <form onSubmit={submit} className="grid gap-4 border-t border-white/8 p-5 sm:grid-cols-2"><label className="text-sm text-slate-400">类型<select name="mediaType" className="field mt-2"><option value="ANIME">Anime</option><option value="VISUAL_NOVEL">Galgame / Visual Novel</option></select></label><label className="text-sm text-slate-400">标题 *<input name="title" required maxLength={300} className="field mt-2" /></label><label className="text-sm text-slate-400">原始标题<input name="originalTitle" maxLength={300} className="field mt-2" /></label><label className="text-sm text-slate-400">封面 URL<input name="coverUrl" type="url" className="field mt-2" /></label><label className="text-sm text-slate-400">播出 / 发售日期<input name="releaseDate" type="date" className="field mt-2" /></label><label className="text-sm text-slate-400 sm:col-span-2">简介<textarea name="description" rows={4} className="field mt-2 resize-y" /></label><div className="sm:col-span-2"><button disabled={busy} className="button-primary"><Plus className="size-4" />{busy ? "保存中…" : "添加到收藏"}</button>{message && <p className="mt-2 text-sm text-rose-300">{message}</p>}</div></form>}</section>;
}
