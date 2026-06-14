export function validateBattleTag(tag: string): { valid: boolean; error?: string } {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return { valid: false, error: "Battle.net ID is required" };

  if (!/^.{3,12}#\d{4,}$/.test(cleaned)) {
    return { valid: false, error: "Format: Name#1234" };
  }

  return { valid: true };
}

export function parseRaiderProfileUrl(
  url: string
): { region: string; realm: string; name: string } | null {
  const cleaned = String(url || "").trim();
  const match = cleaned.match(/characters\/([^/]+)\/([^/]+)\/([^/?]+)/i);
  if (!match) return null;
  const [, region, realm, name] = match;
  if (!region || !realm || !name) return null;
  return { region: region.toLowerCase(), realm, name: decodeURIComponent(name) };
}
