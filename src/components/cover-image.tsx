"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_COVER } from "@/lib/constants";

export function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    // 普通 img 允许手动添加任意图片 URL，并通过 onError 可靠降级到本地占位图。
    // eslint-disable-next-line @next/next/no-img-element
    <img src={!src || failed ? DEFAULT_COVER : src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn("bg-[#151a24] object-cover", className)} />
  );
}
