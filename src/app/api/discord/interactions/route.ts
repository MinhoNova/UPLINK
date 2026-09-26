import { verifyKey } from "discord-interactions";
import {
  applyToLobbyFromDiscord,
  confirmInviteFromDiscord,
  declineInviteFromDiscord,
} from "@/lib/lobbyDiscord";
import {
  DISCORD_ENTRY_ROLES,
  DISCORD_MAX_ENTRY_ROLES,
} from "@/lib/discordConstants";
import {
  getMemberEntryRoles,
  toggleEntryRole,
} from "@/lib/discordGuild";

const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function interactionResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function ephemeral(content: string) {
  return interactionResponse({
    type: 4,
    data: { content: content.slice(0, 2000), flags: 64 },
  });
}

export async function POST(req: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const signature = req.headers.get("X-Signature-Ed25519") || "";
  const timestamp = req.headers.get("X-Signature-Timestamp") || "";
  const body = await req.text();

  console.error(
    `[interact] hit url=${req.url} sig=${signature ? "yes" : "no"} ts=${timestamp ? "yes" : "no"} bodyHead=${body?.slice(0, 80)}`
  );

  try {
    const { getKV, setKV } = await import("@/lib/db");
    const prev = (await getKV("debug_interact_clock")) || 0;
    await setKV("debug_interact_clock", Number(prev) + 1);
  } catch (e) {
    console.error("[interact][clock] failed:", e && (e as Error).message);
  }

  if (!publicKey) {
    return new Response("DISCORD_PUBLIC_KEY not configured", { status: 503 });
  }

  if (!verifyKey(body, signature, timestamp, publicKey)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  if (interaction.type === 1) {
    return interactionResponse({ type: 1 });
  }

  if (interaction.type !== 3) {
    return ephemeral("Unsupported interaction.");
  }

  const customId = String(interaction.data?.custom_id || "");

  try {
    if (customId.startsWith("apply_")) {
      const lobbyId = customId.slice("apply_".length);
      const userId = interaction.member?.user?.id || interaction.user?.id;
      if (!userId) return ephemeral("Could not identify your Discord account.");

      const result = await applyToLobbyFromDiscord(userId, lobbyId);
      if (!result.ok) return ephemeral(result.error);

      return ephemeral(
        `✅ Application sent!\nThe owner will review you on UPLINK.\n${SITE_URL}/?lobby=${lobbyId}`
      );
    }

    if (customId.startsWith("discord_accept_")) {
      const parts = customId.split("_");
      const notifId = parts[parts.length - 1];
      const lobbyId = parts[parts.length - 2];
      const userId = interaction.member?.user?.id || interaction.user?.id;
      if (!userId) return ephemeral("Could not identify your Discord account.");

      const result = await confirmInviteFromDiscord(userId, lobbyId, notifId);
      if (!result.ok) return ephemeral(result.error);
      return ephemeral(`✅ Invite accepted!\n${SITE_URL}/?lobby=${lobbyId}`);
    }

    if (customId.startsWith("discord_decline_")) {
      const parts = customId.split("_");
      const notifId = parts[parts.length - 1];
      const lobbyId = parts[parts.length - 2];
      const userId = interaction.member?.user?.id || interaction.user?.id;
      if (!userId) return ephemeral("Could not identify your Discord account.");

      const result = await declineInviteFromDiscord(userId, lobbyId, notifId);
      if (!result.ok) return ephemeral(result.error);
      return ephemeral("Invite declined.");
    }

    if (customId.startsWith("role_")) {
      const roleSpec = DISCORD_ENTRY_ROLES.find((r) => r.customId === customId);
      if (!roleSpec) return ephemeral("Unknown role button.");
      const userId = interaction.member?.user?.id || interaction.user?.id;
      if (!userId) return ephemeral("Could not identify your account.");

      const result = await toggleEntryRole(userId, roleSpec);
      if (!result.ok) {
        if (result.reason === "max") {
          return ephemeral(
            `⛔ You can hold up to **${DISCORD_MAX_ENTRY_ROLES}** channel roles (region + ARABIC CHAT). Remove one first by clicking your current buttons again.`
          );
        }
        if (result.reason === "notfound") {
          return ephemeral(
            `⚠️ Role "**${roleSpec.name}**" was not found in this server. Please tell an admin to check the role name.`
          );
        }
        return ephemeral("⚠️ Could not change your roles. Make sure you are in this server.");
      }

      const held = await getMemberEntryRoles(userId);
      const list = held.length
        ? held.map((r) => `• ${r.name}`).join("\n")
        : "_None selected yet._";
      const state = result.added ? "✅" : "❌";
      return ephemeral(
        `${state} **${roleSpec.name}** ${result.added ? "added" : "removed"}.\n\n**Your channels (${held.length}/${DISCORD_MAX_ENTRY_ROLES}):**\n${list}`
      );
    }

    return ephemeral("Unknown button.");
  } catch (e) {
    console.error("discord interaction error:", e);
    return ephemeral("Something went wrong. Try again on the website.");
  }
}
