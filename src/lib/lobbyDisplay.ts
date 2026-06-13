/** Client-safe lobby display helpers (no server/db imports). */

export function lobbyRunCount(lobby: any): number {
  if (lobby?.category === "leveling") return 1;
  return (
    (Object.values(lobby?.selectedDungeons || {}) as number[]).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    ) || Number(lobby?.runsCount) || 1
  );
}
