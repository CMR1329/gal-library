import Link from "next/link";
import Image from "next/image";
import { House, LibraryBig, Search } from "lucide-react";
import { AuthControls } from "./auth-controls";

const links = [
  { href: "/", label: "首页", icon: House },
  { href: "/library", label: "我的收藏", icon: LibraryBig },
  { href: "/search", label: "搜索添加", icon: Search },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0b0e14]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          <span className="brand-mark grid size-9 place-items-center overflow-hidden rounded-xl shadow-lg">
            <Image src="/p4-icon.png" alt="" width={36} height={36} className="size-full object-cover" priority />
          </span>
          <span>蓝山栞</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="nav-link">
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <AuthControls />
        </nav>
      </div>
    </header>
  );
}
