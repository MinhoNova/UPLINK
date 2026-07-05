"use client";

import { useState, useEffect } from "react";
import type { TalentTree } from "@/lib/wowData";

function TalentNode({
  name, id, selected, color,
}: {
  name: string; id?: number; selected: boolean; color: string;
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    if (id) {
      fetch(`/api/wow/blizzard/icon?type=spell&id=${id}`)
        .then(r => r.json())
        .then(d => { if (!cancelled && d.available && d.url) setIconUrl(d.url); })
        .catch(() => {});
    } else {
      fetch(`/api/wow/blizzard/icon?type=spell&name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(d => { if (!cancelled && d.available && d.url) setIconUrl(d.url); })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [name, id, selected]);

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
        }}
      >
        {selected && iconUrl ? (
          <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
        ) : selected ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
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
        const selected = tree.nodes.filter((n) => n.selected);
        const rowsByRow: Record<number, typeof selected> = {};
        for (const node of selected) {
          if (!rowsByRow[node.row]) rowsByRow[node.row] = [];
          rowsByRow[node.row].push(node);
        }
        const maxRow = Math.max(...Object.keys(rowsByRow).map(Number), 0);

        return (
          <div key={tree.name} className="bg-gradient-to-b from-[#0c0c18] to-black rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{tree.name}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="flex flex-col items-center gap-3">
              {Array.from({ length: maxRow + 1 }, (_, row) => {
                const nodesInRow = rowsByRow[row] || [];
                return (
                  <div key={row} className="flex items-center justify-center gap-2.5 w-full">
                    {nodesInRow.map((node) => (
                      <TalentNode
                        key={node.name}
                        name={node.name}
                        id={node.id}
                        selected={true}
                        color={color}
                      />
                    ))}
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
