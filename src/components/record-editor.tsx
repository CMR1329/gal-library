"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { getStatusOptions } from "@/lib/constants";

type RouteItem = { name: string; completed: boolean; completedAt?: string | null; notes?: string | null };
type EntryData = {
  status: string; score: number | null; progressCurrent: number | null; progressTotal: number | null; progressText: string | null;
  startedAt: string | null; completedAt: string | null; activityYear: number | null; rewatchCount: number; plannedRewatch: boolean; playtimeMinutes: number | null;
  completedAllRoutes: boolean; notes: string | null; tags: string[]; routes: RouteItem[];
};

export function RecordEditor({ mediaId, mediaType, entry }: { mediaId: string; mediaType: string; entry: EntryData }) {
  const [routes, setRoutes] = useState<RouteItem[]>(entry.routes);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const numberOrNull = (name: string) => data.get(name) === "" ? null : Number(data.get(name));
    const body = {
      status: String(data.get("status")), score: numberOrNull("score"), progressCurrent: numberOrNull("progressCurrent"),
      progressTotal: numberOrNull("progressTotal"), progressText: String(data.get("progressText") || "") || null,
      startedAt: String(data.get("startedAt") || "") || null, completedAt: String(data.get("completedAt") || "") || null,
      activityYear: data.get("activityYear") === "" ? null : Number(data.get("activityYear")),
      rewatchCount: Number(data.get("rewatchCount") || 0), plannedRewatch: data.get("plannedRewatch") === "on",
      playtimeMinutes: data.get("playtimeHours") === "" ? null : Math.round(Number(data.get("playtimeHours")) * 60),
      completedAllRoutes: data.get("completedAllRoutes") === "on", notes: String(data.get("notes") || "") || null,
      tags: String(data.get("tags") || "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean), routes,
    };
    try {
      const response = await fetch(`/api/library/${mediaId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (response.status === 401) { router.push(`/login?callbackURL=${encodeURIComponent(`/media/${mediaId}`)}`); return; }
      if (!response.ok) throw new Error(payload.error || "保存失败。");
      setMessage("已保存"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败。"); }
    finally { setBusy(false); }
  }

  function updateRoute(index: number, patch: Partial<RouteItem>) {
    setRoutes((current) => current.map((route, routeIndex) => routeIndex === index ? { ...route, ...patch } : route));
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="状态"><select name="status" defaultValue={entry.status} className="field">{getStatusOptions(mediaType).map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="我的评分"><select name="score" defaultValue={entry.score ?? ""} className="field"><option value="">未评分</option>{Array.from({ length: 21 }, (_, index) => index / 2).map((score) => <option key={score} value={score}>{score.toFixed(1)}</option>)}</select></Field>
        <Field label="开始日期"><input name="startedAt" type="date" defaultValue={entry.startedAt ?? ""} className="field" /></Field>
        <Field label="完成日期"><input name="completedAt" type="date" defaultValue={entry.completedAt ?? ""} className="field" /></Field>
        <Field label={mediaType === "ANIME" ? "观看年份" : "游玩年份"}><input name="activityYear" type="number" min="1900" max="2200" placeholder="例如 2026" defaultValue={entry.activityYear ?? ""} className="field" /></Field>
        {mediaType === "ANIME" ? <>
          <Field label="当前集数"><input name="progressCurrent" type="number" min="0" defaultValue={entry.progressCurrent ?? ""} className="field" /></Field>
          <Field label="总集数"><input name="progressTotal" type="number" min="0" defaultValue={entry.progressTotal ?? ""} className="field" /></Field>
          <Field label="重看次数"><input name="rewatchCount" type="number" min="0" defaultValue={entry.rewatchCount} className="field" /></Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-300"><input name="plannedRewatch" type="checkbox" defaultChecked={entry.plannedRewatch} className="size-4 accent-violet-500" />计划重看</label>
        </> : <>
          <Field label="游戏时长（小时）"><input name="playtimeHours" type="number" min="0" step="0.1" defaultValue={entry.playtimeMinutes != null ? entry.playtimeMinutes / 60 : ""} className="field" /></Field>
          <Field label="当前进度"><input name="progressText" maxLength={200} defaultValue={entry.progressText ?? ""} placeholder="当前章节或路线" className="field" /></Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-300"><input name="completedAllRoutes" type="checkbox" defaultChecked={entry.completedAllRoutes} className="size-4 accent-violet-500" />已完成全路线</label>
        </>}
      </div>
      <Field label="我的标签（用逗号分隔）"><input name="tags" defaultValue={entry.tags.join("，")} className="field" placeholder="输入自己的标签" /></Field>
      {mediaType === "VISUAL_NOVEL" && <div>
        <div className="mb-3 flex items-center justify-between"><label className="text-sm text-slate-400">Route 记录</label><button type="button" onClick={() => setRoutes((current) => [...current, { name: "", completed: false }])} className="button-secondary px-3 py-2 text-xs"><Plus className="size-3" />添加 Route</button></div>
        <div className="space-y-2">{routes.map((route, index) => <div key={index} className="grid gap-2 rounded-xl border border-white/8 bg-black/10 p-2 sm:grid-cols-[auto_1fr_9rem_auto]"><label className="flex items-center gap-2 px-2 text-xs text-slate-400"><input type="checkbox" checked={route.completed} onChange={(event) => updateRoute(index, { completed: event.target.checked })} className="accent-violet-500" />完成</label><input value={route.name} onChange={(event) => updateRoute(index, { name: event.target.value })} placeholder="Route / 角色名称" className="field" /><input type="date" value={route.completedAt ?? ""} onChange={(event) => updateRoute(index, { completedAt: event.target.value || null })} className="field" /><button type="button" aria-label="删除 Route" onClick={() => setRoutes((current) => current.filter((_, routeIndex) => routeIndex !== index))} className="grid size-10 place-items-center self-center rounded-lg text-slate-600 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="size-4" /></button></div>)}{routes.length === 0 && <p className="rounded-xl border border-dashed border-white/8 p-5 text-center text-sm text-slate-600">还没有 Route 记录，可以手动添加角色或路线名称。</p>}</div>
      </div>}
      <Field label={mediaType === "ANIME" ? "笔记 / 短评" : "笔记 / 感想"}><textarea name="notes" rows={8} defaultValue={entry.notes ?? ""} className="field resize-y leading-7" placeholder="只有当前账号可以看到这些内容。" /></Field>
      <div className="flex items-center gap-3"><button disabled={busy} className="button-primary min-w-28">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{busy ? "保存中" : "保存记录"}</button>{message && <span className={`text-sm ${message === "已保存" ? "text-emerald-300" : "text-rose-300"}`}>{message}</span>}</div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm text-slate-400">{label}<span className="mt-2 block">{children}</span></label>;
}
