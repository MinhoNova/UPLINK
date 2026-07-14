"use client";

import { useState, useEffect } from "react";
import type { TalentTree } from "@/lib/wowData";

const iconCache = new Map<string, string>();

function TalentNode({
  name, id, iconName, selected, color, classId, count, total,
}: {
  name: string; id?: number; iconName?: string; selected: boolean; color: string; classId?: string; count?: number; total?: number;
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    if (iconName) return `https://render.worldofwarcraft.com/icons/56/${iconName}.jpg`;
    const cacheKey = id ? `spell:${id}` : `spell:${name}`;
    const cached = iconCache.get(cacheKey);
    return cached || null;
  });

  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    if (iconUrl && !iconFailed) return;
    let cancelled = false;
    const cacheKey = id ? `spell:${id}` : `spell:${name}`;
    if (iconCache.has(cacheKey)) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const params = new URLSearchParams({ type: "spell", name });
    if (id) params.set("id", String(id));
    if (classId) params.set("classId", classId);
    const url = `/api/wow/blizzard/icon?${params}`;

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
  }, [name, id, iconUrl, iconFailed]);

  const popColor = count != null && count > 0 && total && count / total >= 0.7 ? "#f97316" : selected ? color : undefined;
  const nodeColor = popColor || (selected ? color : undefined);
  const labelColor = count != null && count > 0 ? (count / (total || 1) >= 0.7 ? "#f97316" : "#a335ee") : "rgba(255,255,255,0.15)";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          background: nodeColor
            ? `linear-gradient(135deg, ${nodeColor}25 0%, ${nodeColor}10 100%)`
            : "rgba(255,255,255,0.03)",
          border: nodeColor
            ? `1.5px solid ${nodeColor}60`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: nodeColor
            ? `0 0 12px ${nodeColor}20, inset 0 0 8px ${nodeColor}10`
            : "none",
          opacity: nodeColor ? 1 : 0.4,
        }}
      >
        {iconUrl && !iconFailed ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-full h-full object-cover"
            style={{ opacity: nodeColor ? 1 : 0.55 }}
            onError={() => { iconCache.delete(id ? `spell:${id}` : `spell:${name}`); setIconFailed(true); }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: nodeColor ? `linear-gradient(135deg, ${nodeColor}25 0%, ${nodeColor}10 100%)` : "rgba(255,255,255,0.03)" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColor || "rgba(255,255,255,0.3)", opacity: nodeColor ? 1 : 0.3 }} />
          </div>
        )}
      </div>
      <span
        className="text-[6px] font-bold text-center leading-tight max-w-[60px] truncate px-0.5"
        style={{ color: labelColor }}
      >
        {name}
      </span>
      {count != null && (
        <span className="text-[7px] font-black" style={{ color: count > 0 ? (count / (total || 1) >= 0.7 ? "#f97316" : "#a335ee") : "rgba(255,255,255,0.2)" }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default function WowTalentTreeDisplay({ trees, color, classId }: { trees: TalentTree[]; color: string; classId?: string }) {
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
                          iconName={node.iconName}
                          selected={node.selected}
                          color={color}
                          classId={classId}
                          count={node.count}
                          total={node.total}
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
