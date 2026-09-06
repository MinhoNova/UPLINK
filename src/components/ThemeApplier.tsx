"use client";

import { useEffect } from "react";

export default function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const light = window.localStorage.getItem("uplink_theme") === "light";
      document.documentElement.classList.toggle("light", light);
      document.documentElement.classList.toggle("dark", !light);
    };
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "uplink_theme") apply();
    };
    window.addEventListener("uplink-theme-change", apply);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("uplink-theme-change", apply);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}