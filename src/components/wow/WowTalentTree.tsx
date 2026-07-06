"use client";

import { useState, useEffect } from "react";
import type { TalentTree } from "@/lib/wowData";

const iconCache = new Map<string, string>();
const ICON_CACHE_TTL = 30 * 60 * 1000;

function TalentNode({
  name, id, selected, color,
}: {
  name: string; id?: number; selected: boolean; color: string;
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    const cacheKey = id ? `spell:${id}` : `spell:${name}`;
    const cached = iconCache.get(cacheKey);
    return cached || null;
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

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          background: selected
            ? `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`
            : "rgba(255,255,255,0.03)",
          border: selected
            ? `1.5px solid ${color}60`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: selected
            ? `0 0 12px ${color}20, inset 0 0 8px ${color}10`
            : "none",
          opacity: selected ? 1 : 0.4,
        }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="w-full h-full object-cover" style={{ opacity: selected ? 1 : 0.55 }} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: selected ? 1 : 0.3 }} />
          </div>
        )}
      </div>
      <span
        className="text-[6px] font-bold text-center leading-tight max-w-[60px] truncate px-0.5"
        style={{ color: selected ? `${color}cc` : "rgba(255,255,255,0.15)" }}
      >
        {name}
      </span>
    </div>
  );
}

export default function WowTalentTreeDisplay({ trees, color }: { trees: TalentTree[]; color: string }) {
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
                const hasNodes = tree.nodes.some((n) => (n.row || 0) === row);
                if (!hasNodes) return null;
                const colsInRow = tree.nodes.filter((n) => (n.row || 0) === row);
                const maxCol = Math.max(...colsInRow.map((n) => n.col || 0), 0);
                return (
                  <div key={row} className="flex items-center justify-center gap-2.5 w-full">
                    {Array.from({ length: maxCol + 1 }, (_, col) => {
                      const node = nodesByRowCol.get(`${row}-${col}`);
                      if (!node) {
                        return <div key={`${row}-${col}`} className="w-10 h-10" />;
                      }
                      return (
                        <TalentNode
                          key={node.name || `${row}-${col}`}
                          name={node.name}
                          id={node.id}
                          selected={node.selected}
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
