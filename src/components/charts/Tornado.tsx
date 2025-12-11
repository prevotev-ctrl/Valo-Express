"use client";
import React from "react";

type Row = { label: string; low: number; high: number };

export default function Tornado({ data, unit = "", base }: { data: Row[]; unit?: string; base?: number }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
  const min = Math.min(...sorted.map((d) => Math.min(d.low, d.high, base ?? 0)));
  const max = Math.max(...sorted.map((d) => Math.max(d.low, d.high, base ?? 0)));
  const span = max - min || 1;

  return (
    <div className="border rounded p-3 bg-white text-sm overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Analyse Tornado</div>
        <div className="text-xs text-gray-500 space-x-2">
          <span>WACC ±1pt</span>
          <span>g LT ±0.5pt</span>
          <span>Marge/Capex ±1pt</span>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((d, i) => {
          const start = Math.min(d.low, d.high);
          const end = Math.max(d.low, d.high);
          const left = ((start - min) / span) * 100;
          const width = ((end - start) / span) * 100;
          const pctImpactLow = base ? ((d.low - base) / base) * 100 : null;
          const pctImpactHigh = base ? ((d.high - base) / base) * 100 : null;
          return (
            <div key={i} className="grid grid-cols-[150px_1fr_160px] items-center gap-2 max-w-full">
              <div className="text-gray-700 truncate" title={d.label}>
                {d.label}
              </div>
              <div className="relative h-3 bg-forest-100 rounded-full overflow-hidden">
                {base !== undefined && (
                  <div
                    className="absolute top-[-4px] h-4 w-[2px] bg-black"
                    style={{ left: `${((base - min) / span) * 100}%` }}
                    title={`Base ${base.toFixed(2)} ${unit}`}
                  />
                )}
                <div
                  className="absolute top-0 h-3 brand-gradient"
                  style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(0, width)}%` }}
                />
              </div>
              <div className="text-right text-xs tabular-nums">
                {d.low.toFixed(2)}→{d.high.toFixed(2)} {unit}
                {pctImpactLow !== null && pctImpactHigh !== null && (
                  <div className="text-[10px] text-gray-500">
                    {pctImpactLow.toFixed(1)}% → {pctImpactHigh.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
