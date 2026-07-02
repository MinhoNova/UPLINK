import { getBlizzardToken } from "./auth";

interface CharacterMediaAsset {
  key: string;
  value: string;
}

export interface CharacterRender {
  avatar: string | null;
  inset: string | null;
  main: string | null;
  mainRaw: string | null;
}

const REGION_HOSTS: Record<string, string> = {
  us: "https://us.api.blizzard.com",
  eu: "https://eu.api.blizzard.com",
  kr: "https://kr.api.blizzard.com",
  tw: "https://tw.api.blizzard.com",
  cn: "https://gateway.battlenet.com.cn",
};

export async function fetchCharacterRender(
  name: string,
  realm: string,
  region: string
): Promise<CharacterRender | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  const host = REGION_HOSTS[region.toLowerCase()] || REGION_HOSTS.us;
  const realmSlug = realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
  const nameLower = name.toLowerCase().replace(/'/g, "");

  const url = `${host}/profile/wow/character/${realmSlug}/${nameLower}/character-media?namespace=profile-${region.toLowerCase()}&locale=en_US&access_token=${token}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const data = await res.json();
    const assets: CharacterMediaAsset[] = data.assets || [];

    const render: CharacterRender = {
      avatar: assets.find((a) => a.key === "avatar")?.value || null,
      inset: assets.find((a) => a.key === "inset")?.value || null,
      main: assets.find((a) => a.key === "main")?.value || null,
      mainRaw: assets.find((a) => a.key === "main-raw")?.value || null,
    };

    return render;
  } catch {
    return null;
  }
}
