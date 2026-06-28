"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Activity,
  FileSearch,
  Ban,
  Search,
  ChevronLeft,
  X,
  Clock,
  Globe,
  Fingerprint,
  Hash,
  TicketCheck,
  ShieldX,
} from "lucide-react";
import AdminAnalyticsPanel from "@/components/admin/AdminAnalyticsPanel";
import AdminAuditPanel from "@/components/admin/AdminAuditPanel";
import AdminIpBanPanel from "@/components/admin/AdminIpBanPanel";
import AdminModerationPanel from "@/components/admin/AdminModerationPanel";

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "audit", label: "Audit Log", icon: FileSearch },
  { id: "ipbans", label: "IP Bans", icon: Ban },
  { id: "moderation", label: "Reports", icon: ShieldAlert },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((data) => {
      setUsers(data.registeredUsers || []);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u: any) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.id || "").includes(q) ||
        (u.lastKnownIp || "").includes(q)
    );
  }, [users, searchQuery]);

  const totalUsers = users.length;
  const clubUsers = users.filter((u: any) => u.subscription?.tier === "secret_club").length;
  const freeUsers = users.filter((u: any) => !u.subscription?.tier || u.subscription?.tier === "free").length;
  const usersWithDrafts = users.filter((u: any) => u.offerDrafts?.length > 0).length;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-violet-500/[0.03] blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#ff007f]/[0.03] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <ShieldAlert className="w-6 h-6 inline-block text-violet-500 mr-2" />
                Admin <span className="text-violet-500">Dashboard</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{totalUsers} registered users</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/5 mb-8 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                    : "text-gray-500 hover:text-white border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-4">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-white mt-1">{totalUsers}</p>
              </div>
              <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-4">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Secret Club</p>
                <p className="text-2xl font-black text-yellow-400 mt-1">{clubUsers}</p>
              </div>
              <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-4">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Free</p>
                <p className="text-2xl font-black text-gray-400 mt-1">{freeUsers}</p>
              </div>
              <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-4">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">With Offer Drafts</p>
                <p className="text-2xl font-black text-[#00ffff] mt-1">{usersWithDrafts}</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, username, Discord ID, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-violet-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">User</th>
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Discord ID</th>
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Last IP</th>
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Last Seen</th>
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Tier</th>
                    <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Drafts</th>
                    <th className="text-right px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user: any) => {
                    const tier = user.subscription?.tier;
                    const hasDrafts = user.offerDrafts?.length > 0;
                    const lastSeen = user.lastSeenAt
                      ? new Date(user.lastSeenAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—";
                    return (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{user.name || "—"}</div>
                              <div className="text-[9px] text-gray-500">@{user.username || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] font-mono text-gray-400 bg-white/[0.03] px-1.5 py-0.5 rounded">{user.id}</code>
                        </td>
                        <td className="px-4 py-3">
                          {user.lastKnownIp ? (
                            <span className="text-[10px] font-mono text-orange-300">{user.lastKnownIp}</span>
                          ) : (
                            <span className="text-[10px] text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-gray-400">{lastSeen}</span>
                        </td>
                        <td className="px-4 py-3">
                          {tier === "secret_club" ? (
                            <span className="px-2 py-0.5 rounded-full text-yellow-400 border border-yellow-500/50 bg-yellow-500/20 font-black text-[8px] uppercase tracking-widest">CLUB</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-gray-500 border border-white/10 bg-white/5 font-black text-[8px] uppercase tracking-widest">FREE</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasDrafts ? (
                            <span className="text-[10px] text-[#00ffff] font-black">{user.offerDrafts.length}</span>
                          ) : (
                            <span className="text-[10px] text-gray-600">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white hover:border-violet-500/40 transition"
                          >
                            {expandedUserId === user.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500 text-xs font-black uppercase tracking-widest">
                  {searchQuery ? "No users match your search." : "No users found."}
                </div>
              )}
            </div>

            {expandedUserId && (
              <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6 relative">
                <button
                  onClick={() => setExpandedUserId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
                {(() => {
                  const user = users.find((u: any) => u.id === expandedUserId);
                  if (!user) return null;
                  const fields = [
                    { label: "Name", value: user.name },
                    { label: "Username", value: `@${user.username}` },
                    { label: "Discord ID", value: user.id },
                    { label: "Display Name", value: user.displayName || user.discordDisplayName },
                    { label: "Battle Tag", value: user.battleTag },
                    { label: "Last Known IP", value: user.lastKnownIp },
                    { label: "Last Seen", value: user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString() : "—" },
                    { label: "Subscription Tier", value: user.subscription?.tier },
                    { label: "Subscription End", value: user.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : "—" },
                    { label: "Avatar Effect", value: user.effect },
                    { label: "Has VFX", value: user.activeVfx ? "Yes" : "No" },
                    { label: "Profile GIF", value: user.profileGif ? "Yes" : "No" },
                    { label: "Welcome Claimed", value: user.welcomeFreeClaimed ? "Yes" : "No" },
                    { label: "Offer Drafts", value: user.offerDrafts?.length || 0 },
                    { label: "Custom Avatar", value: user.customAvatar ? "Yes" : "No" },
                    { label: "VFX List", value: user.userVfx?.length ? `${user.userVfx.length} items` : "—" },
                  ];
                  return (
                    <div>
                      <h3 className="text-lg font-black text-white mb-4">User Details</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fields.map((f) => (
                          <div key={f.label} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{f.label}</p>
                            <p className="text-sm font-bold text-white truncate">{String(f.value ?? "—")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-black text-white mb-4">Analytics</h2>
            <AdminAnalyticsPanel />
          </div>
        )}

        {activeTab === "audit" && (
          <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-black text-white mb-4">Audit Log</h2>
            <AdminAuditPanel />
          </div>
        )}

        {activeTab === "ipbans" && (
          <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-black text-white mb-4">IP Ban Management</h2>
            <AdminIpBanPanel />
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-black text-white mb-4">Community Reports</h2>
            <AdminModerationPanel />
          </div>
        )}
      </div>
    </div>
  );
}
