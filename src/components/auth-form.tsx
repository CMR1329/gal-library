"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallback = searchParams.get("callbackURL");
  const callbackURL = requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//") ? requestedCallback : "/";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const username = String(data.get("username") || "").trim();
    try {
      const result = mode === "login"
        ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name: username, email, password, username } as Parameters<typeof authClient.signUp.email>[0]);
      if (result.error) throw new Error(result.error.message || (mode === "login" ? "邮箱或密码不正确。" : "注册失败，请检查填写内容。"));
      router.push(callbackURL); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求失败，请稍后重试。");
    } finally { setBusy(false); }
  }

  return <div className="surface w-full max-w-md p-6 sm:p-8"><div className="grid grid-cols-2 rounded-xl bg-black/20 p-1"><button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`rounded-lg py-2 text-sm ${mode === "login" ? "bg-white/8 text-white" : "text-slate-500"}`}>登录</button><button type="button" onClick={() => { setMode("register"); setMessage(""); }} className={`rounded-lg py-2 text-sm ${mode === "register" ? "bg-white/8 text-white" : "text-slate-500"}`}>注册</button></div><div className="mt-6"><p className="text-sm text-violet-300">{mode === "login" ? "Welcome back" : "Create your library"}</p><h1 className="mt-2 text-2xl font-semibold">{mode === "login" ? "登录蓝山栞" : "创建私人账号"}</h1>{mode === "login" && <p className="mt-2 text-sm leading-6 text-slate-500">登录后只会读取属于这个账号的收藏记录。</p>}</div><form onSubmit={submit} className="mt-6 space-y-4">{mode === "register" && <label className="block text-sm text-slate-400">用户名<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" autoComplete="username" className="field mt-2" /><span className="mt-1.5 block text-xs text-slate-600">仅使用字母、数字、下划线或短横线</span></label>}<label className="block text-sm text-slate-400">邮箱<input name="email" required type="email" autoComplete="email" className="field mt-2" /></label><label className="block text-sm text-slate-400">密码<input name="password" required type="password" minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field mt-2" /><span className="mt-1.5 block text-xs text-slate-600">至少 8 个字符</span></label>{message && <p className="rounded-lg border border-rose-400/15 bg-rose-400/8 p-3 text-sm text-rose-200">{message}</p>}<button disabled={busy} className="button-primary w-full">{busy ? <LoaderCircle className="size-4 animate-spin" /> : mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}{busy ? "请稍候…" : mode === "login" ? "登录" : "注册并进入收藏库"}</button></form></div>;
}
