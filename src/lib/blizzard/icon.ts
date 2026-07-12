import { getBlizzardToken } from "./auth";

export async function fetchBlizzardIcon(name: string, type: "item" | "spell"): Promise<string | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  try {
    const searchUrl = `https://us.api.blizzard.com/data/wow/search/${type}?namespace=static-us&locale=en_US&name.en_US=${encodeURIComponent(name)}&orderby=id&_page=1&_pageSize=100`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }
    });
    
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) return null;
    
    // Find exact match first, fall back to first result
    const exactMatch = searchData.results.find((r: any) =>
      r.data.name?.toLowerCase() === name.toLowerCase()
    );
    const result = exactMatch || searchData.results[0];
    const entityId = result.data.id;

    const mediaUrl = `https://us.api.blizzard.com/data/wow/media/${type}/${entityId}?namespace=static-us&locale=en_US`;
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }
    });

    if (!mediaRes.ok) return null;
    const mediaData = await mediaRes.json();
    const assets = mediaData.assets || [];
    const iconAsset = assets.find((a: any) => a.key === "icon");
    
    return iconAsset ? iconAsset.value : null;
  } catch (e) {
    return null;
  }
}

export async function fetchSpellIconById(spellId: number): Promise<string | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  try {
    const mediaUrl = `https://us.api.blizzard.com/data/wow/media/spell/${spellId}?namespace=static-us&locale=en_US`;
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }
    });

    if (!mediaRes.ok) return null;
    const mediaData = await mediaRes.json();
    const assets = mediaData.assets || [];
    const iconAsset = assets.find((a: any) => a.key === "icon");
    
    return iconAsset ? iconAsset.value : null;
  } catch (e) {
    return null;
  }
}

export async function fetchItemIconById(itemId: number): Promise<string | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  try {
    const mediaUrl = `https://us.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-us&locale=en_US`;
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }
    });

    if (!mediaRes.ok) return null;
    const mediaData = await mediaRes.json();
    const assets = mediaData.assets || [];
    const iconAsset = assets.find((a: any) => a.key === "icon");
    
    return iconAsset ? iconAsset.value : null;
  } catch (e) {
    return null;
  }
}
