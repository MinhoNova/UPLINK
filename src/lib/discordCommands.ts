/**
 * Slash command surface.
 *
 * Until now the bot had buttons and nothing else: the interactions endpoint
 * answered PING and Message Components, and explicitly rejected
 * `InteractionType.ApplicationCommand`. So the only way to find an offer was to
 * already be standing in front of its embed. `/offers` is what makes the server
 * browsable on its own.
 *
 * The definitions live here rather than in a script so the handler and the
 * registration payload can never drift — `scripts/discord-register-commands.cjs`
 * PUTs `DISCORD_COMMAND_DEFINITIONS`, and the router dispatches on the same
 * names.
 */

export const DISCORD_COMMAND_DEFINITIONS = [
  {
    name: "offers",
    description: "Browse open Aion 2 offers",
    options: [
      {
        type: 3, // STRING
        name: "category",
        description: "Filter by category",
        required: false,
        choices: [
          { name: "Leveling", value: "leveling" },
          { name: "Dungeons", value: "dungeons" },
          { name: "Raids", value: "raids" },
          { name: "Professions", value: "professions" },
        ],
      },
    ],
  },
  {
    name: "apply",
    description: "Apply to an offer and pick the character you are bringing",
    options: [
      {
        type: 3,
        name: "offer",
        description: "The offer id, e.g. from /offers",
        required: true,
      },
    ],
  },
  {
    name: "mycharacters",
    description: "Show the characters linked to your UPLINK account",
    options: [],
  },
] as const;

export type DiscordCommandName = (typeof DISCORD_COMMAND_DEFINITIONS)[number]["name"];

/** Discord caps a message at 10 embeds; leave room for the footer embed. */
export const DISCORD_MAX_OFFERS_PER_COMMAND = 9;

export const DISCORD_CATEGORY_LABEL: Record<string, string> = {
  leveling: "🚀 Leveling",
  dungeons: "🏰 Dungeons",
  raids: "⚔️ Raids",
  professions: "🛠️ Professions",
};