"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function ShareProfileButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" onClick={copyLink} className="button-secondary shrink-0" title="复制公开主页链接">
    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    <span>{copied ? "链接已复制" : "分享主页"}</span>
  </button>;
}
