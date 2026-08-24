import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getPublicSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "蓝山栞 · 私人作品收藏", template: "%s · 蓝山栞" },
  description: "本地优先的 Anime 与 Galgame 私人收藏数据库",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { backgroundImageUrl } = await getPublicSiteSettings();
  const backgroundStyle: CSSProperties | undefined = backgroundImageUrl ? {
    backgroundColor: "var(--background)",
    backgroundImage: `linear-gradient(color-mix(in srgb, var(--background) 70%, transparent), color-mix(in srgb, var(--background) 70%, transparent)), url(${JSON.stringify(backgroundImageUrl)})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  } : undefined;
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(()=>{try{const t=localStorage.getItem('blueshan-theme');if(t)document.documentElement.dataset.theme=t}catch{}})()` }} /></head>
      <body style={backgroundStyle}>
        <ThemeProvider><Nav /><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 sm:px-6 lg:py-11">{children}</main><ThemeSwitcher /></ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
