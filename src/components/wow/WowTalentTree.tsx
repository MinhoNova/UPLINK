"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { TalentTree } from "@/lib/wowData";

function TalentIcon({ name, selected, color }: { name: string; selected: boolean; color: string }) {
  const shortName = name
    .replace(/['']/g, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center aspect-square rounded-xl text-[6px] font-black leading-tight transition-all select-none ${
        selected ? "shadow-lg" : "opacity-40"
      }`}
      style={
        selected
          ? { backgroundColor: `${color}20`, border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}40` }
          : { backgroundColor: "#0a0a16", border: "1px solid rgba(255,255,255,0.06)" }
      }
      title={name}
    >
      <span className={`${selected ? "text-white" : "text-gray-600"} text-center px-0.5 leading-tight`}>
        {shortName}
      </span>
    </div>
  );
}

export default function WowTalentTreeDisplay({ trees, color }: { trees: TalentTree[]; color: string }) {
  if (!trees || trees.length === 0) return null;

  return (
    <div className="space-y-5">
      {trees.map((tree) => {
        const maxCol = 2;
        return (
          <div key={tree.name}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[1px] flex-1 bg-white/5" />
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">{tree.name}</span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="flex flex-col gap-1">
              {tree.nodes
                .filter((n) => n.selected)
                .map((node) => (
                  <div key={node.name} className="flex items-center gap-2">
                    <div className="w-6 h-6 shrink-0">
                      <TalentIcon name={node.name} selected={true} color={color} />
                    </div>
                    <span className="text-[11px] font-bold text-white/90 truncate">{node.name}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
