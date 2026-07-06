import { getBlizzardToken } from "./auth";

export interface ItemDetailStat {
  name: string;
  value: number;
}

export interface ItemDetailSet {
  name: string;
  bonuses: { description: string }[];
}

export interface ItemDetail {
  id: number;
  name: string;
  iconUrl: string | null;
  quality: { id: number; type: string; name: string } | null;
  level: number;
  requiredLevel: number;
  itemClass: string;
  itemSubclass: string;
  inventoryType: string;
  stats: ItemDetailStat[];
  set: ItemDetailSet | null;
}

const detailCache = new Map<number, { data: ItemDetail; expires: number }>();

export async function fetchItemDetail(itemId: number): Promise<ItemDetail | null> {
  const cached = detailCache.get(itemId);
  if (cached && Date.now() < cached.expires) return cached.data;

  const token = await getBlizzardToken();
  if (!token) return null;

  try {
    const [itemRes, iconUrl] = await Promise.all([
      fetch(
        `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
      ),
      fetchItemIcon(itemId, token),
    ]);

    if (!itemRes.ok) return null;
    const data = await itemRes.json();

    const preview = data.preview_item || {};
    const rawStats: { type?: { name?: string; type?: string }; value?: number; is_equip_bonus?: boolean; stat?: { name?: string } }[] = preview.stats || [];
    const stats: ItemDetailStat[] = rawStats
      .filter((s: any) => s.is_equip_bonus !== false)
      .map((s: any) => ({
        name: s.type?.name || s.stat?.name || "Unknown",
        value: s.value || 0,
      }));

    let set: ItemDetailSet | null = null;
    if (preview.set) {
      const setBonuses: { description: string }[] = (preview.set.effects || []).map(
        (e: any) => ({ description: e.display_string || e.description || "" })
      );
      set = {
        name: preview.set.item_set?.name || "Set",
        bonuses: setBonuses,
      };
    }

    const quality = data.quality
      ? { id: data.quality.id, type: data.quality.type || "", name: data.quality.name || "" }
      : null;

    const detail: ItemDetail = {
      id: data.id || itemId,
      name: data.name || "Unknown",
      iconUrl,
      quality,
      level: data.level || 0,
      requiredLevel: data.required_level || 0,
      itemClass: data.item_class?.name || "",
      itemSubclass: data.item_subclass?.name || "",
      inventoryType: data.inventory_type?.name || "",
      stats,
      set,
    };

    detailCache.set(itemId, { data: detail, expires: Date.now() + 3600000 });
    return detail;
  } catch {
    return null;
  }
}

async function fetchItemIcon(itemId: number, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://us.api.blizzard.com/data/wow/media/item/${itemId}?namespace=static-us&locale=en_US`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const iconAsset = (data.assets || []).find((a: any) => a.key === "icon");
    return iconAsset?.value || null;
  } catch {
    return null;
  }
}
