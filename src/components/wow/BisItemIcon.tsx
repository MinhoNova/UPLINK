"use client";

import { useState, useEffect } from "react";
import { Crown, CircleDot, Shirt, SquareStack, Shield, HandMetal, LinkChain, Rows3, Footprints, Gem, Sparkles, Swords, BookOpen } from "lucide-react";

const GEAR_SLOT_ICONS: Record<string, any> = {
  Head: Crown, Neck: CircleDot, Shoulders: Shirt, Back: SquareStack, Chest: Shield,
  Wrist: CircleDot, Hands: HandMetal, Waist: LinkChain, Legs: Rows3, Feet: Footprints,
  Rings: Gem, Trinkets: Sparkles, Weapon: Swords, "Off-Hand": BookOpen,
};

const itemIconCache = new Map<string, string>();

export default function BisItemIcon({ slot, color, itemId, itemName, size = 80 }: { slot: string; color: string; itemId?: number; itemName?: string; size?: number }) {
  const cacheKey = itemId ? `item:${itemId}` : itemName ? `item:${itemName}` : "";
  const cached = cacheKey ? itemIconCache.get(cacheKey) : undefined;
  const [iconUrl, setIconUrl] = useState<string | null>(cached || null);
  useEffect(() => {
    if (!cacheKey || cached) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const query = itemId ? `type=item&id=${itemId}` : `type=item&name=${encodeURIComponent(itemName!)}`;
    fetch(`/api/wow/blizzard/icon?${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        clearTimeout(timer);
        if (!cancelled && d.available && d.url) {
          itemIconCache.set(cacheKey, d.url);
          setIconUrl(d.url);
        }
      })
      .catch(() => { clearTimeout(timer); });
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [cacheKey, cached, itemId, itemName]);

  const SlotIcon = GEAR_SLOT_ICONS[slot];
  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size, height: size,
        backgroundColor: `${color}10`,
        border: `2px solid ${color}30`,
        boxShadow: `0 0 20px ${color}15, 0 4px 12px rgba(0,0,0,0.3)`,
      }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className="w-full h-full object-cover" />
      ) : SlotIcon ? (
        <SlotIcon className="w-8 h-8" style={{ color: `${color}bb` }} />
      ) : (
        <Gem className="w-8 h-8" style={{ color: `${color}bb` }} />
      )}
    </div>
  );
}
