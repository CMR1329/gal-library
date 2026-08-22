"use client";

/* eslint-disable @next/next/no-img-element */

import { LoaderCircle, Pencil, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";

export function ProfileEditor({ initialUsername, initialAvatarUrl, initialVisibility = "PRIVATE" }: { initialUsername: string; initialAvatarUrl?: string | null; initialVisibility?: "PUBLIC" | "PRIVATE" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [localAvatar, setLocalAvatar] = useState("");

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1_500_000) {
      setMessage("请选择 1.5MB 以内的图片文件。");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLocalAvatar(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: String(data.get("username") || "").trim(), avatarUrl: localAvatar || String(data.get("avatarUrl") || "").trim(), profileVisibility: data.get("profileVisibility") === "PUBLIC" ? "PUBLIC" : "PRIVATE" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "保存失败。");
      // The session-backed navbar needs a full refresh to pick up the changed profile fields.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/user/${encodeURIComponent(payload.user.username)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
      setBusy(false);
    }
  }

  return <div className="w-full sm:w-auto"><button type="button" onClick={() => { setOpen((value) => !value); setMessage(""); }} className="button-secondary w-full sm:w-auto">{open ? <X className="size-4" /> : <Pencil className="size-4" />}{open ? "取消编辑" : "编辑个人资料"}</button>{open && <form onSubmit={submit} className="surface mt-3 grid gap-3 p-4 sm:absolute sm:right-8 sm:mt-2 sm:w-80 sm:z-10"><label className="text-sm text-slate-400">公开用户名<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_\-]+" defaultValue={initialUsername} className="field mt-2" /></label><label className="text-sm text-slate-400">头像 URL<input name="avatarUrl" type="url" maxLength={500} defaultValue={initialAvatarUrl?.startsWith("http") ? initialAvatarUrl : ""} placeholder="https://…" onChange={() => setLocalAvatar("")} className="field mt-2" /></label><label className="text-sm text-slate-400">或选择本地图片<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={selectAvatar} className="mt-2 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/15 file:px-3 file:py-2 file:text-violet-200" /></label><label className="flex items-center gap-2 text-sm text-slate-400"><input name="profileVisibility" value="PUBLIC" type="checkbox" defaultChecked={initialVisibility === "PUBLIC"} />允许他人通过链接查看我的收藏</label>{localAvatar && <img src={localAvatar} alt="头像预览" className="size-16 rounded-xl object-cover" />}{!localAvatar && initialAvatarUrl && <img src={initialAvatarUrl} alt="当前头像" className="size-16 rounded-xl object-cover" /> }<p className="text-xs leading-5 text-slate-500">修改用户名后，公开主页链接也会同步更新。图片会保存到当前账号资料。</p>{message && <p className="rounded-lg border border-rose-400/15 bg-rose-400/8 p-3 text-sm text-rose-200">{message}</p>}<button disabled={busy} className="button-primary w-full">{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{busy ? "保存中…" : "保存资料"}</button></form>}</div>;
}
