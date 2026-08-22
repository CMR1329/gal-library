import Link from "next/link";

export default function NotFound() {
  return <div className="surface mx-auto max-w-xl p-8 text-center"><p className="text-5xl font-bold text-slate-700">404</p><h1 className="mt-4 text-xl font-semibold">没有找到这个页面</h1><Link className="button-primary mt-6" href="/">返回首页</Link></div>;
}
