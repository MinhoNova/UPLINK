"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "dark" | "light";

const THEME_STORAGE_KEY = "uplink_theme";

const readSavedTheme = (): ThemePreference => {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
};

const emitThemeChange = () => {
  window.dispatchEvent(new Event("uplink-theme-change"));
};

const subscribeToTheme = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("uplink-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("uplink-theme-change", callback);
  };
};

export function useThemePreference() {
  const theme = useSyncExternalStore(subscribeToTheme, readSavedTheme, () => "dark");

  const setTheme = useCallback((nextTheme: string) => {
    const normalizedTheme = nextTheme === "light" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
    emitThemeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = readSavedTheme() === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    emitThemeChange();
  }, []);

  return { theme, setTheme, toggleTheme, isLight: theme === "light" };
}
