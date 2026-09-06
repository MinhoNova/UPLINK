"use client";

import { useSyncExternalStore } from "react";

type FlagKey = "uplink_bg_motion";

const readFlag = (key: FlagKey, def: boolean): boolean => {
  if (typeof window === "undefined") return def;
  const v = window.localStorage.getItem(key);
  if (v === null) return def;
  return v === "true";
};

const emitFlag = () => window.dispatchEvent(new Event("uplink-flag-change"));

const subscribeFlags = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("uplink-flag-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("uplink-flag-change", cb);
  };
};

export function useFlag(key: FlagKey, def = true) {
  return useSyncExternalStore(subscribeFlags, () => readFlag(key, def), () => def);
}

export function setFlag(key: FlagKey, value: boolean) {
  window.localStorage.setItem(key, value ? "true" : "false");
  emitFlag();
}