"use client";

import { useState } from "react";
import type { TalentTree, TalentNode } from "@/lib/wowData";

function TalentNodeCell({ node, color }: { node: TalentNode; color: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg text-[8px] font-black text-center leading-tight px-1 py-1.5 transition-all ${
        node.selected
          ? "text-white border-2 shadow-lg"
          : "text-gray-600 border border-white/5 bg-white/[0.02]"
      }`}
      style={
        node.selected
          ? { backgroundColor: `${color}25`, borderColor: `${color}80`, boxShadow: `0 0 8px ${color}30` }
          : {}
      }
      title={node.name}
    >
      <span className={`${node.selected ? "opacity-100" : "opacity-40"}`}>{node.name}</span>
    </div>
  );
}

export default function WowTalentTreeDisplay({ trees, color }: { trees: TalentTree[]; color: string }) {
  if (!trees || trees.length === 0) return null;

  return (
    <div className="space-y-6">
      {trees.map((tree) => {
        const maxRow = Math.max(...tree.nodes.map((n) => n.row));
        const maxCol = Math.max(...tree.nodes.map((n) => n.col));
        const rows: TalentNode[][] = [];
        for (let r = 1; r <= maxRow; r++) {
          const rowNodes: (TalentNode | null)[] = [];
          for (let c = 1; c <= maxCol; c++) {
            const node = tree.nodes.find((n) => n.row === r && n.col === c) || null;
            rowNodes.push(node);
          }
          rows.push(rowNodes.filter(Boolean) as TalentNode[]);
        }

        return (
          <div key={tree.name}>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{tree.name}</h4>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${maxCol}, 1fr)` }}>
              {tree.nodes.map((node) => (
                <TalentNodeCell key={node.name} node={node} color={color} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
