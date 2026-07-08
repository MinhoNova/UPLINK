"use client";

import { useState, useEffect } from "react";
import type { AggregatedTalentTree } from "@/lib/wowData";

const iconCache = new Map<string, string>();
const ICON_CACHE_TTL = 30 * 60 * 1000;

function AggregatedNode({
  name, id, count, total, color,
}: {
  name: string; id?: number; count: number; total: number; color: string;
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    const cacheKey = id ? `spell:${id}` : `spell:${name}`;
    return iconCache.get(cacheKey) || null;
  });

  useEffect(() => {
    let cancelled = false;
    const cacheKey = id ? `spell:${id}` : `spell:${name}`;
    if (iconCache.has(cacheKey)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const url = id
      ? `/api/wow/blizzard/icon?type=spell&id=${id}`
      : `/api/wow/blizzard/icon?type=spell&name=${encodeURIComponent(name)}`;
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        clearTimeout(timer);
        if (!cancelled && d.available && d.url) {
          iconCache.set(cacheKey, d.url);
          setIconUrl(d.url);
        }
      })
      .catch(() => { clearTimeout(timer); });
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [name, id]);

  const hot = count > 0;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const intensity = hot ? Math.max(0.3, pct / 100) : 0;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          background: hot
            ? `linear-gradient(135deg, #f97316${Math.round(intensity * 40).toString(16).padStart(2, '0')} 0%, #f97316${Math.round(intensity * 15).toString(16).padStart(2, '0')} 100%)`
            : "rgba(255,255,255,0.03)",
          border: hot
            ? `1.5px solid #f97316${Math.round(intensity * 70).toString(16).padStart(2, '0')}`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: hot
            ? `0 0 12px #f97316${Math.round(intensity * 25).toString(16).padStart(2, '0')}`
            : "none",
          opacity: hot ? 1 : 0.35,
        }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="w-full h-full object-cover" style={{ opacity: hot ? 1 : 0.5 }} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hot ? "#f97316" : color, opacity: hot ? 1 : 0.3 }} />
          </div>
        )}
        {hot && (
          <div
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[7px] font-black px-1 leading-none shadow-lg"
            style={{ background: count >= total * 0.9 ? "#f97316" : count >= total * 0.5 ? "#e07b3a" : "#666" }}
          >
            {count}
          </div>
        )}
      </div>
      <span
        className="text-[6px] font-bold text-center leading-tight max-w-[60px] truncate px-0.5"
        style={{ color: hot ? `rgba(255,255,255,0.7)` : "rgba(255,255,255,0.12)" }}
      >
        {name}
      </span>
    </div>
  );
}

export default function WowAggregatedTalentTree({ trees, color }: { trees: AggregatedTalentTree[]; color: string }) {
  if (!trees || trees.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {trees.map((tree) => {
        const maxRow = Math.max(...tree.nodes.map((n) => n.row || 0), 0);
        const nodesByRowCol = new Map<string, typeof tree.nodes[0]>();
        for (const node of tree.nodes) {
          nodesByRowCol.set(`${node.row || 0}-${node.col || 0}`, node);
        }

        return (
          <div key={tree.name} className="bg-gradient-to-b from-[#0c0c18] to-black rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{tree.name}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="flex flex-col items-center gap-3">
              {Array.from({ length: maxRow + 1 }, (_, row) => {
                const colsInRow = tree.nodes.filter((n) => (n.row || 0) === row);
                if (colsInRow.length === 0) return null;
                const maxCol = Math.max(...colsInRow.map((n) => n.col || 0), 0);
                return (
                  <div key={row} className="flex items-center justify-center gap-2.5 w-full">
                    {Array.from({ length: maxCol + 1 }, (_, col) => {
                      const node = nodesByRowCol.get(`${row}-${col}`);
                      if (!node) return <div key={`${row}-${col}`} className="w-10 h-10" />;
                      return (
                        <AggregatedNode
                          key={node.name || `${row}-${col}`}
                          name={node.name}
                          id={node.id}
                          count={node.count}
                          total={node.total}
                          color={color}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}