"use client";

import { createContext, useContext } from "react";

export interface PageContextValue {
  currentUserId: any;
  currentUserDisplay: string;
  currentUserDiscordHandle: any;
  isAdmin: boolean;
  session: any;
  myEffect: string;
  myVfxBg?: any;
  registeredUsers: any[];
  setRegisteredUsers: (users: any[]) => void;
  EFFECTS: Record<string, string>;
  EFFECT_IMG: Record<string, string>;
  theme: string;
  setTheme: (theme: string) => void;
  addToast: (msg: string, type?: any) => void;
  saveGlobalData: (data: any) => void;
  playSound: (type: any) => void;
  t: (key: string) => string;
  getUserTier: (userId: any) => string;
  getUserTierLabel: (userId: any) => { label: string; color: string } | null;
  getVfxSettings: (user: any) => { showOnBanner: boolean; showOnOngoing: boolean; showOnModal: boolean };
  renderDualColorName: (name: string) => any;
  isUserHidden: (userId: any) => boolean;
  resolveMemberVisual: (member: any) => any;
  resolveUserVisual: (identifier: any) => any;
  resolveChatIdentity: (
    userId?: string,
    stored?: { from?: string; fromAvatar?: string; fromHandle?: string }
  ) => { name: string; avatar: string };
  openRatePicker: (lobby: any) => void;
  DUNGEONS: { name: string; img: string; short: string }[];
  WOW_CLASS_GROUPS: Record<string, string[]>;
  CLASS_ROLE_OPTIONS: Record<string, string[]>;
  AUTO_ACCEPT_DURATION_MS: number;
  AvatarWithEffect: any;
  electricColor: number;
  setElectricColor: (color: number) => void;
}

export const PageContext = createContext<PageContextValue>(null!);

export function usePage() {
  return useContext(PageContext);
}
