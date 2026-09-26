"use client";

import { useCallback, useSyncExternalStore } from "react";

const RAIL_STORAGE_KEY = "uplink_siderail_open";

const readRailOpen = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(RAIL_STORAGE_KEY) === "1";
};

const emitRailChange = () => {
  window.dispatchEvent(new Event("uplink-siderail-change"));
};

const subscribeToRail = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("uplink-siderail-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("uplink-siderail-change", callback);
  };
};

export function useSideRailOpen() {
  const open = useSyncExternalStore(subscribeToRail, readRailOpen, () => false);

  const toggleRail = useCallback(() => {
    window.localStorage.setItem(RAIL_STORAGE_KEY, readRailOpen() ? "0" : "1");
    emitRailChange();
  }, []);

  return { open, toggleRail };
}
