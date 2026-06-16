export type DungeonInfo = {
  name: string;
  img: string;
  short: string;
};

export const DUNGEONS: DungeonInfo[] = [
  { name: "Algeth'ar Academy", img: "/classes/Algeth'ar Academy.webp", short: "AA" },
  { name: "Magisters Terrace", img: "/classes/Magisters Terrace.webp", short: "MT" },
  { name: "Maisara Caverns", img: "/classes/Maisara Caverns.webp", short: "MC" },
  { name: "Nexus-Point Xenas", img: "/classes/Nexus-Point Xenas.webp", short: "NPX" },
  { name: "Pit of Saron", img: "/classes/Pit of Saron.webp", short: "POS" },
  { name: "Seat of the Triumvirate", img: "/classes/Seat of the Triumvirate.webp", short: "SEAT" },
  { name: "Skyreach", img: "/classes/Skyreach.webp", short: "SR" },
  { name: "Windrunner Spire", img: "/classes/Windrunner Spire.webp", short: "WS" },
];

const BY_SHORT = Object.fromEntries(DUNGEONS.map((d) => [d.short, d]));
const BY_NAME = Object.fromEntries(DUNGEONS.map((d) => [d.name, d]));

export function resolveKeystoneDungeon(key?: string | null): DungeonInfo | null {
  const raw = String(key || "").trim();
  if (!raw) return null;
  return BY_SHORT[raw.toUpperCase()] || BY_NAME[raw] || BY_NAME[raw.replace(/_/g, " ")] || null;
}

export function getMemberKeystoneInfo(member: any) {
  const key = member?.keystone || member?.dungeon || "";
  const dungeon = resolveKeystoneDungeon(key);
  const keyLvl = member?.applicantKeyLevel ?? member?.keyLevel ?? "";
  const dropLvl = member?.applicantDropLevel ?? member?.dropLevel ?? "";
  if (!dungeon && !keyLvl && !dropLvl) return null;
  return { dungeon, keyLvl, dropLvl };
}
