/**
 * Slash command handlers. Pure-ish: they take the interaction data plus the
 * caller's Discord snowflake and return a ready-to-send interaction payload, so
 * the router stays thin and this is testable without an HTTP round trip.
 */

import { getKV } from "@/lib/db";
import { isUserBanned } from "@/lib/banCheck";
import { lobbyRunCount } from "@/lib/lobbyDisplay";
import { classThumbUrl } from "@/lib/classThumb";
import {
  DISCORD_MAX_OFFERS_PER_COMMAND,
  DISCORD_CATEGORY_LABEL,
} from "@/lib/discordCommands";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");

export function ephemeralPayload(content: string, embeds?: unknown[]) {
  return {
    type: 4,
    data: {
      content: content.slice(0, 2000),
      ...(embeds && embeds.length ? { embeds } : {}),
      flags: 64,
    },
  };
}

function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Mirrors the lobby feed: finished and failed offers are not something to join. */
function isOpenOffer(l: any): boolean {
  const status = String(l?.status || "open").toLowerCase();
  if (["done", "completed", "failed", "cancelled", "canceled", "closed", "expired"].includes(status)) return false;
  if (Number(l?.accepted?.length || 0) > 0 && isFullyStaffed(l)) return false;
  return true;
}

function isFullyStaffed(l: any): boolean {
  const roles = Object.entries(l?.roles || {}).filter(([, n]) => Number(n) > 0);
  if (!roles.length) return false;
  const confirmed = (Array.isArray(l?.accepted) ? l.accepted : []).filter((m: any) => m?.status === "confirmed");
  return roles.every(([, needed]) => {
    const role = String(Object.keys(l.roles || {}).find((k) => l.roles[k] === needed) || "");
    return confirmed.filter((m: any) => String(m.role || m.applicantRole || "").toLowerCase() === role.toLowerCase()).length >=
      Number(needed);
  });
}

function offerEmbed(l: any) {
  const category = String(l?.category || "").toLowerCase();
  const singleClass = (() => {
    if (l?.aionClass) return String(l.aionClass);
    if (Array.isArray(l?.requiredClasses)) {
      const clean = l.requiredClasses.map((c: any) => String(c || "").trim()).filter(Boolean);
      return clean.length === 1 ? clean[0] : "";
    }
    return "";
  })();

  const rolesStr =
    Object.entries(l?.roles || {})
      .filter(([, n]) => Number(n) > 0)
      .map(([r, n]) => `**${String(r).toUpperCase()}** ×${n}`)
      .join(" · ") || "Any role";

  return {
    author: { name: String(l?.ownerDiscordName || l?.ownerHandle || "Unknown") },
    title: `${DISCORD_CATEGORY_LABEL[category]?.split(" ")[0] || "🎮"} ${String(l?.title || category || "Mission")}`.slice(0, 256),
    ...(singleClass ? { thumbnail: { url: absolute(classThumbUrl(singleClass)) } } : {}),
    color: category === "leveling" ? 0x8a2be2 : category === "raids" ? 0xff007f : category === "professions" ? 0x22c55e : 0x00b7ff,
    fields: [
      { name: "💰 Offer", value: `**${l?.totalGold || 0}K** gold`, inline: true },
      { name: "🏃 Runs", value: `**${lobbyRunCount(l)}**`, inline: true },
      { name: "🎯 Open Roles", value: rolesStr.slice(0, 1024), inline: false },
    ],
    footer: { text: `UPLINK · Offer ${l?.id}` },
  };
}

function applyButton(lobbyId: string) {
  return {
    type: 1,
    components: [
      {
        type: 2,
        style: 3,
        label: "Apply",
        url: absolute(`/apply/${lobbyId}`),
        emoji: { name: "⚡" },
      },
      {
        type: 2,
        style: 5,
        label: "Thread",
        url: absolute(`/manage/${lobbyId}`),
        emoji: { name: "🌐" },
      },
    ],
  };
}

async function resolveViewer(discordUserId: string) {
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const user = registeredUsers.find((u: any) => String(u.id) === String(discordUserId));
  return { user, registeredUsers };
}

export async function runOffersCommand(discordUserId: string, category: string) {
  const lobbies: any[] = (await getKV("lobbies")) || [];
  const want = String(category || "").trim().toLowerCase();
  const open = lobbies
    .filter(isOpenOffer)
    .filter((l) => (want ? String(l.category || "").toLowerCase() === want : true))
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))
    .slice(0, DISCORD_MAX_OFFERS_PER_COMMAND);

  if (open.length === 0) {
    return ephemeralPayload(
      want
        ? `No open ${DISCORD_CATEGORY_LABEL[want] || want} offers right now. Check back shortly.`
        : "No open offers right now. Post one and it will appear here and in its category channel.",
    );
  }

  const embeds = open.map(offerEmbed);
  const components = open.map((l) => applyButton(String(l.id)));
  return {
    type: 4,
    data: {
      content: `**${open.length} open offer${open.length === 1 ? "" : "s"}** — only visible to you. Pick one to apply.`,
      embeds,
      components,
      flags: 64,
    },
  };
}

export async function runApplyCommand(discordUserId: string, rawOfferId: string) {
  const lobbyId = String(rawOfferId || "").trim();
  if (!lobbyId) return ephemeralPayload("Which offer? Run `/offers` to list them.");

  const lobbies: any[] = (await getKV("lobbies")) || [];
  const lobby = lobbies.find((l: any) => String(l.id) === String(lobbyId));
  if (!lobby) return ephemeralPayload(`No offer with id \`${lobbyId}\`. Run \`/offers\` for the current list.`);

  const { user } = await resolveViewer(discordUserId);
  const applyUrl = absolute(`/apply/${lobbyId}`);

  if (!user) {
    return ephemeralPayload(
      `Sign in with Discord on UPLINK and add your character, then apply:\n${applyUrl}`,
    );
  }
  if (await isUserBanned(user.username, user.id)) {
    return ephemeralPayload("Your account is suspended. Contact support if this is a mistake.");
  }

  return ephemeralPayload(
    `Choose the character you are bringing for **${String(lobby.title || lobby.category || "this offer")}**:\n${applyUrl}`,
    [offerEmbed(lobby)],
  );
}

export async function runMyCharactersCommand(discordUserId: string) {
  const { user } = await resolveViewer(discordUserId);
  if (!user) {
    return ephemeralPayload(
      `Your Discord account is not linked to UPLINK yet. Sign in with Discord and add a character:\n${absolute("/my-characters")}`,
    );
  }

  const characters: any[] = (await getKV("characters")) || [];
  const mine = characters.filter((c: any) => String(c.userId) === String(discordUserId));

  if (mine.length === 0) {
    return ephemeralPayload(
      `No characters on your UPLINK account yet. Add one here:\n${absolute("/my-characters")}\n\nBoosting offers need a Level 45+ character.`,
    );
  }

  const lines = mine.map((c: any) => {
    const level = Number(c.level ?? c.applicantLevel ?? 0);
    const cls = String(c.aionClass || c.className || "Unknown class");
    const ilvl = Number(c.itemLevel) || 0;
    return `• **${String(c.name || "Unnamed")}** · ${cls} · Level ${level || "?"}${ilvl ? ` · iLvl ${ilvl}` : ""}${level < 45 ? " _(too low for offers — Level 45 required)_" : ""}`;
  });

  return ephemeralPayload(
    `**${mine.length} character${mine.length === 1 ? "" : "s"}** on your UPLINK account:\n${lines.join("\n")}\n\nApply from here: ${absolute("/")}`,
  );
}