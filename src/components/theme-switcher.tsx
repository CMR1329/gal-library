"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { THEMES, useTheme, type ThemeId } from "./theme-provider";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const visibleTheme = mounted ? theme : null;
  return <div className="theme-switcher" data-open={open ? "true" : "false"}>
    <div className="theme-dots">
      {THEMES.map((item, index) => <button
        key={item.id}
        type="button"
        className={`theme-dot ${item.id === visibleTheme ? "is-selected" : ""}`}
        style={{ "--theme-base": item.base, "--theme-accent": item.accent, "--dot-index": index } as React.CSSProperties}
        aria-label={`${item.label}主题`}
        title={`${item.label}主题`}
        onClick={() => { setTheme(item.id as ThemeId); setOpen(false); }}
      />)}
    </div>
    <button type="button" className="theme-main-button" aria-label={open ? "收起主题选择" : "展开主题选择"} title="切换主题" onClick={() => setOpen((current) => !current)}><Palette className="size-4" /></button>
  </div>;
}
