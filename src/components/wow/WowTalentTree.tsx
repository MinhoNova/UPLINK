"use client";

import type { TalentTree } from "@/lib/wowData";

function TalentNode({
  name, selected, color, row, maxRow,
}: {
  name: string; selected: boolean; color: string; row: number; maxRow: number;
}) {
  const shortName = name
    .replace(/['']/g, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const [iconUrl, setIconUrl] = import("react").useState<string | null>(null);

  import("react").useEffect(() => {
    if (!selected) return;
    fetch(`/api/wow/blizzard/icon?type=spell&name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => {
        if (d.available && d.url) setIconUrl(d.url);
      })
      .catch(() => {});
  }, [name, selected]);

  return (
    <div className="flex flex-col items-center relative flex-1 max-w-[64px]">
      {row < maxRow && (
        <div
          className="absolute w-0.5"
          style={{
            top: "100%",
            height: "16px",
            background: selected
              ? `linear-gradient(180deg, ${color}60, ${color}20)`
              : "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)",
          }}
        />
      )}
      <div
        className="relative flex items-center justify-center transition-all duration-300 select-none w-full"
        style={{
          aspectRatio: "1",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: selected
            ? `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
            : "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)",
          border: selected ? `1px solid ${color}80` : "1px solid rgba(255,255,255,0.06)",
          boxShadow: selected
            ? `0 0 15px ${color}50, inset 0 0 10px ${color}30`
            : "none",
        }}
      >
        {selected && (
          <>
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: `radial-gradient(ellipse at 50% 30%, ${color}40 0%, transparent 70%)`,
              }}
            />
            {/* WoW-style shine overlay */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: `linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 30%, transparent 50%)`,
              }}
            />
          </>
        )}
          {/* Inner icon circle: colored circle with shortName or icon */}
          <div
            className="relative z-10 w-[75%] aspect-square rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${color}dd 0%, ${color}88 100%)`
                : "rgba(255,255,255,0.04)",
              boxShadow: selected
                ? `inset 0 0 6px rgba(0,0,0,0.4), 0 0 8px ${color}30`
                : "inset 0 0 3px rgba(0,0,0,0.3)",
              border: selected
                ? `1px solid ${color}aa`
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {selected && iconUrl ? (
              <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <>
                {selected && (
                  <div
                    className="absolute w-[30%] h-[30%] rounded-full opacity-50"
                    style={{
                      top: "12%",
                      right: "12%",
                      background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)`,
                    }}
                  />
                )}
                <span
                  className="text-[6px] font-black leading-tight text-center relative z-20"
                  style={{ color: selected ? "#fff" : "rgba(255,255,255,0.2)" }}
                >
                  {selected ? shortName : "?"}
                </span>
              </>
            )}
          </div>
      </div>
      <span
        className="mt-1 text-[5px] font-bold text-center leading-tight truncate w-full px-0.5"
        style={{ color: selected ? `${color}cc` : "rgba(255,255,255,0.15)" }}
      >
        {name}
      </span>
    </div>
  );
}

export default function WowTalentTreeDisplay({ trees, color }: { trees: TalentTree[]; color: string }) {
  if (!trees || trees.length === 0) return null;

  const rows = trees.map((tree) => {
    const selected = tree.nodes.filter((n) => n.selected);
    const rowsByRow: Record<number, typeof selected> = {};
    for (const node of selected) {
      if (!rowsByRow[node.row]) rowsByRow[node.row] = [];
      rowsByRow[node.row].push(node);
    }
    const maxRow = Math.max(...Object.keys(rowsByRow).map(Number), 0);
    return { tree, rows: rowsByRow, maxRow };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {rows.map(({ tree, rows: rowMap, maxRow }) => (
        <div key={tree.name} className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{tree.name}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex flex-col items-center gap-3">
            {Array.from({ length: maxRow + 1 }, (_, row) => {
              const nodesInRow = rowMap[row] || [];
              if (nodesInRow.length === 0) {
                return (
                  <div key={row} className="flex items-center justify-center py-1 opacity-20">
                    <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                      <span className="text-[5px] text-gray-600">—</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={row} className="flex items-center justify-center gap-2 w-full">
                  {nodesInRow.map((node) => (
                    <TalentNode
                      key={node.name}
                      name={node.name}
                      selected={true}
                      color={color}
                      row={row}
                      maxRow={maxRow}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
