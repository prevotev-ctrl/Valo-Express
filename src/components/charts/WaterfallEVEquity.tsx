"use client";
import React from "react";

type Item = { label: string; value: number };

export default function WaterfallEVEquity({ items }: { items: Item[] }) {
  const maxAbs = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  const fmt = new Intl.NumberFormat("fr-FR");

  return (
    <div className="w-full border rounded-lg p-3 bg-white overflow-hidden">
      <div className="text-sm font-medium mb-2">EV → Equity (waterfall simplifié)</div>
      <div className="space-y-2">
        {items.map((it, idx) => {
          const widthPct = (Math.abs(it.value) / maxAbs) * 100;
          return (
            <div key={idx} className="grid grid-cols-[minmax(120px,1fr)_1fr_auto] items-center gap-2 text-sm max-w-full">
              <div className="text-gray-600 truncate" title={it.label}>{it.label}</div>
              <div className="h-3 bg-forest-100 relative rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 h-3 ${it.value >= 0 ? "bg-forest-600" : "bg-red-400"}`}
                  style={{ width: `${Math.min(100, widthPct)}%` }}
                />
              </div>
              <div className="text-right tabular-nums">{fmt.format(Math.round(it.value))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
