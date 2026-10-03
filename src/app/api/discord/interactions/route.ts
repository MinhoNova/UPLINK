import { verifyKey } from "discord-interactions";
import {
  applyToLobbyFromDiscord,
  confirmInviteFromDiscord,
  declineInviteFromDiscord,
} from "@/lib/lobbyDiscord";
import {
  DISCORD_MAX_ENTRY_ROLES,
  getDiscordEntryRoles,
} from "@/lib/discordConstants";
import {
  getMemberEntryRoles,
  toggleEntryRole,
} from "@/lib/discordGuild";
import {
  runOffersCommand,
  runApplyCommand,
  runMyCharactersCommand,
  ephemeralPayload,
} from "@/lib/discordCommandHandlers";
import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";

const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function interactionResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function ephemeral(content: string) {
  return interactionResponse(ephemeralPayload(content));
}

export async function POST(req: Request) {
  // Secrets live as Worker bindings, not in process.env, so pull them across
  // before reading DISCORD_PUBLIC_KEY. Skipping this made the endpoint 503 on
  // every Discord button press in production.
  await syncAuthEnvFromCloudflare();

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return new Response("DISCORD_PUBLIC_KEY not configured", { status: 503 });
  }

  const signature = req.headers.get("X-Signature-Ed25519") || "";
  const timestamp = req.headers.get("X-Signature-Timestamp") || "";
  const body = await req.text();

  // `verifyKey` is async — it returns a Promise, and a Promise is always
  // truthy. Testing it without awaiting meant the check was
  // `!truthyPromise` === false, i.e. it never failed and the endpoint was open
  // to anyone on the internet. That is how a forged interaction could grant
  // real Discord roles, accept invites on another user's behalf, and write
  // into the offers blob with no signature at all. Await it, and fail closed
  // if verification itself errors.
  let signatureOk = false;
  try {
    signatureOk = await verifyKey(body, signature, timestamp, publicKey);
  } catch (e) {
    console.error("verifyKey threw:", e);
    signatureOk = false;
  }
  if (!signatureOk) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  if (interaction.type === 1) {
    return interactionResponse({ type: 1 });
  }

  // Slash commands used to be answered with "Unsupported interaction." — the
  // only way to find an offer was to already be standing in front of its embed.
  if (interaction.type === 2) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const name = String(interaction.data?.name || "");
    const options: any[] = Array.isArray(interaction.data?.options) ? interaction.data.options : [];
    const optionOf = (optName: string) => String(options.find((o: any) => o.name === optName)?.value ?? "");

    try {
      if (!userId) return ephemeral("Could not identify your Discord account.");

      if (name === "offers") {
        return interactionResponse(await runOffersCommand(userId, optionOf("category")));
      }
      if (name === "apply") {
        return interactionResponse(await runApplyCommand(userId, optionOf("offer")));
      }
      if (name === "mycharacters") {
        return interactionResponse(await runMyCharactersCommand(userId));
      }
      return ephemeral(`Unknown command \`/${name}\`.`);
    } catch (e) {
      console.error("discord command error:", e);
      return ephemeral("Something went wrong. Try again on the website.");
    }
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
        `✅ Application sent!\nThe owner will review you on UPLINK.\n${SITE_URL}/manage/${lobbyId}`
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
      return ephemeral(`✅ Invite accepted!\n${SITE_URL}/manage/${lobbyId}`);
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
      const roleSpec = getDiscordEntryRoles().find((r) => r.customId === customId);
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
