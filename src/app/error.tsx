"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="surface mx-auto max-w-xl p-8 text-center"><p className="text-lg font-semibold">页面暂时无法打开</p><p className="mt-2 text-sm leading-6 text-slate-500">可能是网络中断或第三方资料库暂时不可用。已经收藏的本地数据不会受影响。</p><button onClick={reset} className="button-primary mt-5">重新尝试</button></div>;
}
