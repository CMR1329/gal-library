"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const THEMES = [
  { id: "light-blue", label: "天蓝", base: "#F7FBFF", accent: "#52A9E8" },
  { id: "light-yellow", label: "淡黄", base: "#FFFDF4", accent: "#F2C94C" },
  { id: "light-pink", label: "B站粉", base: "#FFF9FC", accent: "#FB7299" },
  { id: "light-green", label: "浅薄荷绿", base: "#F8FDFB", accent: "#63C78C" },
  { id: "dark-purple", label: "夜紫", base: "#101116", accent: "#8067D9" },
  { id: "dark-blue", label: "深海蓝", base: "#0D131A", accent: "#568FC7" },
  { id: "dark-red", label: "暗红", base: "#141011", accent: "#B65F70" },
  { id: "dark-green", label: "墨绿", base: "#0F1412", accent: "#5A9E7A" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
const STORAGE_KEY = "blueshan-theme";

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (theme: ThemeId) => void }>({
  theme: "dark-purple",
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "dark-purple";
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const initial = stored || document.documentElement.dataset.theme as ThemeId | undefined;
    return initial && THEMES.some((item) => item.id === initial) ? initial : "dark-purple";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const value = useMemo(() => ({
    theme,
    setTheme(next: ThemeId) {
      setThemeState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
