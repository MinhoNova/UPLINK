"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Bell, DoorOpen, DoorClosed, MessageCircle, Zap, ArrowLeft } from "lucide-react";
import { ProtocolMark } from "@/components/ProtocolMark";
import ProfileAvatarWithEffect from "@/components/ProfileAvatarWithEffect";
import { effectiveAvatarEffect } from "@/lib/userProfile";
import { resolveProfileImage } from "@/lib/profileImage";
import { useThemePreference } from "@/hooks/useThemePreference";
import { computeDmUnreadCounts, totalDmUnreadCount } from "@/lib/dmHelpers";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useThemePreference();
  const pathname = usePathname();
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentUserId = (session?.user as any)?.id || "";
  const currentHandle = (session?.user as any)?.username || "";

  const [autoApplyEnabled, setAutoApplyEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("uplink_auto_apply") === "true";
  });
  const [autoFeaturesLocked, setAutoFeaturesLocked] = useState(false);

  useEffect(() => {
    const syncLockState = (event: Event) => {
      const detail = (event as CustomEvent<{ locked?: boolean }>).detail;
      setAutoFeaturesLocked(!!detail?.locked);
    };
    window.addEventListener("set-auto-features-locked", syncLockState);
    return () => window.removeEventListener("set-auto-features-locked", syncLockState);
  }, []);

  useEffect(() => {
    const syncAutoApplyState = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      const enabled = typeof detail?.enabled === "boolean"
        ? detail.enabled
        : localStorage.getItem("uplink_auto_apply") === "true";
      setAutoApplyEnabled(enabled);
    };
    window.addEventListener('set-auto-apply-enabled', syncAutoApplyState);
    window.addEventListener('storage', syncAutoApplyState);
    return () => {
      window.removeEventListener('set-auto-apply-enabled', syncAutoApplyState);
      window.removeEventListener('storage', syncAutoApplyState);
    };
  }, []);

  const fetchData = useCallback(() => {
    if (!currentUserId) return;
    fetch("/api/data", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.registeredUsers) setRegisteredUsers(data.registeredUsers);
        if (data.notifications) {
          const mine = data.notifications.filter((n: any) => String(n.targetId) === String(currentUserId));
          setNotifications(mine);
        }

        if (data.directMessages && currentHandle) {
          const directMessages = data.directMessages || [];
          const readMessages = data.readMessages || {};
          let muted: string[] = [];
          try {
            muted = JSON.parse(localStorage.getItem(`muted_users_${currentHandle}`) || "[]");
          } catch { /* ignore */ }

          const counts = computeDmUnreadCounts(directMessages, readMessages, currentHandle);
          setDmUnreadCount(totalDmUnreadCount(counts, { muted }));
        } else {
          setDmUnreadCount(0);
        }
      })
      .catch(() => {});
  }, [currentUserId, currentHandle]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    window.addEventListener("data-refresh", fetchData);

    // Poll for DM updates every 8 seconds
    const pollInterval = setInterval(() => fetchData(), 8000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("data-refresh", fetchData);
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Force register admin if missing
  useEffect(() => {
    const adminHandle = "minhonovazen";
    const adminId = "1497295886223544471";
    
    if (currentHandle === adminHandle && registeredUsers.length > 0 && !registeredUsers.find(u => u.id === adminId)) {
        console.log("Auto-registering admin...");
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                registeredUsers: [...registeredUsers, {
                    id: adminId,
                    name: "Minho Nova",
                    username: adminHandle,
                    avatar: session?.user?.image || ""
                }]
            })
        });
    }
  }, [currentHandle, registeredUsers, session]);

  // Navbar is always visible (public site)
  // if (status !== "loading" && !session) return null;

  // Use session user as fallback if not in registeredUsers
  const currentUser = registeredUsers.find((u: any) => String(u.id) === String(currentUserId)) || {
    id: currentUserId,
    name: session?.user?.name,
    avatar: session?.user?.image,
    username: (session?.user as any)?.username
  };

  const adminHandle = "minhonovazen";
  const adminId = "1497295886223544471";

  const getUserTier = (_userId: string) => {
    return "secret_club";
  };

  const getUserTierLabel = (userId: string) => {
    const u = registeredUsers.find((uu: any) => String(uu.id) === String(userId));
    if (!u?.subscription?.tier) return null;
    if (u.subscription.tier === "secret_club") return { label: "★ CLUB", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
    return null;
  };

  const getAvatarForEffect = () => {
    return resolveProfileImage(currentUser, currentUser?.name || session?.user?.name || "U");
  };

  const renderDualColorName = (name: string) => {
    const parts = name.split(" ");
    if (parts.length < 2) return <span className="bg-gradient-to-r from-[#00ffff] to-[#ff007f] bg-clip-text text-transparent">{name}</span>;
    return (
      <span>
        <span className="bg-gradient-to-r from-[#00ffff] to-[#c4b5fd] bg-clip-text text-transparent">{parts.slice(0, -1).join(" ")}</span>{" "}
        <span className="bg-gradient-to-r from-[#c4b5fd] to-[#ff007f] bg-clip-text text-transparent">{parts[parts.length - 1]}</span>
      </span>
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <motion.nav animate={{ y: navVisible ? 0 : -96 }} className={`fixed top-0 w-full z-50 h-16 sm:h-24 flex items-center ${theme === 'light' ? 'bg-white/50 text-black' : 'bg-transparent text-white'}`}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a
              href={pathname === "/community" ? "/community" : "/"}
              className="flex items-center gap-2.5 shrink-0 rounded-xl transition-opacity hover:opacity-90"
            >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl flex items-center justify-center bg-black/20 backdrop-blur-sm select-none" style={{ boxShadow: pathname === '/community' ? '0 0 18px rgba(255,215,0,0.35)' : '0 0 18px rgba(0,255,255,0.25)', borderWidth: '1px', borderStyle: 'solid', borderColor: pathname === '/community' ? 'rgba(234,179,8,0.6)' : 'rgba(0,255,255,0.4)' }}>
              <ProtocolMark variant={1} className="h-full w-full" gold={pathname === '/community'} />
            </div>
            <div className="hidden sm:flex flex-col items-center leading-none select-none pt-[6px]">
              <span className="text-2xl font-black uppercase tracking-[0.18em] leading-none" style={{ textShadow: pathname === '/community' ? '0 0 15px rgba(255,215,0,0.3)' : undefined }}>
                <span className={pathname === '/community' ? 'text-yellow-500' : `bg-clip-text text-transparent ${theme === 'light' ? 'bg-gradient-to-r from-[#0891b2] via-[#7c3aed] to-[#db2777]' : 'bg-gradient-to-r from-[#00ffff] via-[#c4b5fd] to-[#ff007f]'}`}>
                  {pathname === '/community' ? 'CLUB' : 'Uplink'}
                </span>
              </span>
              {pathname !== '/community' && (
                <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.28em] text-amber-400/95 leading-none">
                  Beta
                </span>
              )}
            </div>
            </a>

          <div className="flex items-center bg-black/5 dark:bg-black/20 px-1 sm:px-1.5 py-1 rounded-2xl gap-1 sm:gap-2 ml-1 sm:ml-8 border border-black/5 dark:border-white/5 transition-all shadow-inner overflow-x-auto max-w-[min(58vw,420px)] sm:max-w-none scrollbar-none">
            <motion.a
              href={pathname === '/community' ? '/' : '/community'}
              title={pathname === '/community' ? 'Back to Home' : getUserTier(currentUserId) === "free" ? 'Secret Club' : 'CLUB'}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (pathname !== '/community' && getUserTier(currentUserId) === "free") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'Secret Club is a premium feature. Subscribe to unlock.', type: 'error' } }));
                }
              }}
              className={`h-8 px-3 sm:px-5 rounded-lg flex items-center gap-1.5 sm:gap-2 font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all border shrink-0 ${getUserTier(currentUserId) === "free" ? 'opacity-40 grayscale' : ''} ${pathname === '/community' ? 'bg-white/5 text-gray-400 hover:text-white border-white/5 hover:bg-[#00ffff]/10 hover:border-[#00ffff]/30' : 'bg-yellow-500/10 text-[#ffd700] border-yellow-500/30 hover:bg-yellow-500 hover:text-black shadow-[0_0_12px_rgba(255,215,0,0.15)]'}`}
            >
              <ProtocolMark variant={1} className="w-5 h-5 shrink-0" gold={pathname !== '/community'} />
              <span className="hidden sm:inline">{pathname === '/community' ? 'Uplink' : 'CLUB'}</span>
            </motion.a>
            {pathname === '/leaderboard' ? (
              <motion.a title="Back to Home" href="/" className="h-8 px-4 rounded-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:bg-[#00ffff]/10 hover:border-[#00ffff]/30">
                <ArrowLeft className="w-4 h-4" /> Back
              </motion.a>
            ) : (
              <motion.a title="Leaderboard" href="/leaderboard" className="h-8 px-4 rounded-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30">
                <Trophy className="w-4 h-4" /> Top
              </motion.a>
            )}
            <motion.button title="Direct Messages" onClick={() => {
              window.dispatchEvent(new CustomEvent('toggle-dm'));
            }} className="h-8 px-2.5 sm:px-4 rounded-lg flex items-center gap-1.5 sm:gap-2 font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 relative shrink-0">
              <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">DM</span>
              {dmUnreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,0,0,0.5)]">
                  {dmUnreadCount > 99 ? '99+' : dmUnreadCount}
                </span>
              )}
            </motion.button>
            <motion.button title="Auto-Apply" onClick={() => {
              if (getUserTier(currentUserId) === "free") {
                window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'Auto-Apply is a Secret Club feature. Subscribe to unlock.', type: 'error' } }));
                return;
              }
              if (autoFeaturesLocked) {
                window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: 'Leave your dungeon run before enabling Auto-Apply.', type: 'error' } }));
                return;
              }
              const newVal = !autoApplyEnabled;
              setAutoApplyEnabled(newVal);
              localStorage.setItem("uplink_auto_apply", newVal ? "true" : "false");
              window.dispatchEvent(new CustomEvent('set-auto-apply-enabled', { detail: { enabled: newVal } }));
            }} className={`h-8 px-2 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-center flex items-center gap-1.5 sm:gap-2 shrink-0 ${getUserTier(currentUserId) === "free" || autoFeaturesLocked ? 'opacity-40 grayscale cursor-not-allowed' : ''} ${autoApplyEnabled ? 'bg-[#00ffff]/20 border border-[#00ffff] text-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              <Zap className="w-4 h-4 shrink-0" /> <span className="hidden md:inline">{getUserTier(currentUserId) === "free" ? 'LOCKED' : autoFeaturesLocked ? 'IN OFFER' : autoApplyEnabled ? 'Auto ON' : 'Auto OFF'}</span>
            </motion.button>
            {pathname === '/' ? (
              <motion.button title="Auto-Apply Settings" onClick={() => {
                if (getUserTier(currentUserId) === "free") return;
                window.dispatchEvent(new CustomEvent('toggle-auto-apply-settings'));
              }} className={`h-8 px-3 rounded-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${getUserTier(currentUserId) === "free" ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}>
                ⚙️
              </motion.button>
            ) : (
              <motion.a title="Auto-Apply Settings" href="/" className={`h-8 px-3 rounded-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${getUserTier(currentUserId) === "free" ? 'opacity-20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}>
                ⚙️
              </motion.a>
            )}
            <motion.button title="Toggle Theme" onClick={toggleTheme} className={`h-8 px-2.5 sm:px-4 rounded-lg flex items-center gap-1.5 sm:gap-2 font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${theme === 'dark' ? 'bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]' : 'bg-white text-black shadow-md border border-black/5'}`}>
              {theme === 'dark' ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6 relative shrink-0">
          {status === "loading" ? (
            <div className="w-32 h-14 bg-white/5 animate-pulse rounded-full" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <motion.button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-3 ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'} hover:bg-[#00ffff]/10 rounded-full transition-all border border-white/10 relative`}>
                  <Bell className={`w-6 h-6 ${notifications.length > 0 ? 'animate-alarm-flash' : 'text-gray-400'}`} />
                  {notifications.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-[#ff007f] rounded-full border-2 border-black"></span>}
                </motion.button>
                {isNotifOpen && (
                  <div className={`absolute top-full mt-4 right-0 w-80 ${theme === 'light' ? 'bg-white shadow-2xl border-black/10' : 'bg-[#0a0a16] border-[#00ffff]/30'} border-2 rounded-2xl p-4 z-50`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest">Alerts</h4>
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
                          CLEAR ALL
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center text-gray-500 py-4 italic">No alerts</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`relative ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} p-3 rounded-xl border border-white/10 mb-2 transition-all group`}>
                          <button onClick={() => dismissNotification(n.id)} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-gray-500 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black">
                            ✕
                          </button>
                          <p className="text-xs mb-1 pr-4"><strong>{n.fromUser}</strong>: {n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {pathname === '/community' && session?.user && (
              <button onClick={() => {
                if (window.location.pathname === '/community') {
                  window.dispatchEvent(new CustomEvent('toggle-community-profile'));
                } else {
                  window.location.href = '/community';
                }
              }} className="flex items-center gap-3 pr-4 pl-1.5 py-1.5 rounded-full border border-[#00ffff]/30 hover:border-[#00ffff] transition-all bg-white/5 hover:bg-[#00ffff]/5">
                <ProfileAvatarWithEffect
                  src={getAvatarForEffect()}
                  effect={currentUser?.effect || "none"}
                  className="w-9 h-9"
                  fallbackName={currentUser?.name || session?.user?.name || "U"}
                />
                <span className="text-xs font-black uppercase tracking-widest hidden sm:block text-white/80 truncate max-w-[100px]">{currentUser?.name || session.user.name}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-[#00ffff] px-2 py-0.5 rounded-md bg-[#00ffff]/10">MY PROFILE</span>
              </button>
              )}

              {pathname !== '/community' && (
              <div className={`flex items-center gap-5 overflow-visible ${theme === 'light' ? 'bg-white border-black/10' : 'bg-black border-white/10'} border-2 pr-8 pl-1 py-1 rounded-full shadow-xl h-[68px]`}>
                <button
                  type="button"
                  title="View profile"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-dm-profile"))}
                  className="shrink-0 rounded-full transition-all hover:ring-2 hover:ring-[#00ffff]/40 overflow-visible"
                >
                  <ProfileAvatarWithEffect
                    src={getAvatarForEffect()}
                    effect={effectiveAvatarEffect(currentUser, currentUser?.effect || "none")}
                    className="w-14 h-14"
                    fallbackName={currentUser?.name || session?.user?.name || "U"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.location.pathname === '/') {
                      window.dispatchEvent(new CustomEvent('open-armory-modal'));
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <span className="text-xl font-black uppercase tracking-widest max-w-[200px] truncate">{renderDualColorName(currentUser?.displayName || currentUser?.name || session.user?.name || "Operative")}</span>
                  {(() => { const t = getUserTierLabel(currentUserId); return t ? <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${t.color}`}>{t.label}</span> : null; })()}
                </button>
              </div>
              )}
            </div>
          ) : (
            <motion.button onClick={() => signIn("discord")} className="px-8 py-4 rounded-xl border-2 border-[#00ffff] text-[#00ffff] font-black text-lg uppercase tracking-widest hover:bg-[#00ffff] hover:text-black transition-all shadow-xl">
              ACCESS TERMINAL
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
