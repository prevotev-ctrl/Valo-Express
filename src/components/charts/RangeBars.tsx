"use client";
import React from "react";

type Band = { method: string; low: number; high: number; note?: string };

export default function RangeBars({
  bands,
  unit = "",
  current,
  currentLabel = "Cours actuel",
}: {
  bands: Band[];
  unit?: string;
  current?: number;
  currentLabel?: string;
}) {
  if (!bands || bands.length === 0) return null;
  const min = Math.min(...bands.map((b) => Math.min(b.low, b.high)));
  const max = Math.max(...bands.map((b) => Math.max(b.low, b.high)));
  const span = max - min || 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * span);
  const clamp = (v?: number) => {
    if (v === undefined) return undefined;
    return Math.min(Math.max(v, min), max);
  };
  const clampedCurrent = clamp(current);

  return (
    <div className="space-y-3">
      {bands.map((b) => {
        const left = ((Math.min(b.low, b.high) - min) / span) * 100;
        const width = (Math.abs(b.high - b.low) / span) * 100;
        const mid = (b.low + b.high) / 2;
        return (
            <div key={b.method} className="space-y-1">
              <div className="grid grid-cols-[170px_70px_1fr_70px] items-center gap-2">
                <div className="text-sm text-gray-700">{b.method}</div>
                <div className="text-xs text-right text-gray-600">{b.low.toFixed(2)} {unit}</div>
              <div className="relative h-10">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded bg-forest-100" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-2 rounded brand-gradient"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${b.low.toFixed(2)} -> ${b.high.toFixed(2)} ${unit}`}
                />
                {clampedCurrent !== undefined && (
                  <div
                    className="absolute top-[-6px] bottom-[-6px] w-[3px] bg-black"
                    style={{ left: `${((clampedCurrent - min) / span) * 100}%` }}
                    title={`${currentLabel}: ${current?.toFixed(2)} ${unit}`}
                  />
                )}
              </div>
              <div className="text-xs text-left text-gray-600">{b.high.toFixed(2)} {unit}</div>
            </div>
            <div className="grid grid-cols-[170px_70px_1fr_70px] items-center gap-2 text-[11px] text-gray-600">
              <div></div>
              <div></div>
              <div className="flex items-center justify-center gap-2">
                <span>Mid {mid.toFixed(2)} {unit}</span>
                {clampedCurrent !== undefined && (
                  <span className="text-gray-500">{currentLabel}: {current?.toFixed(2)} {unit}</span>
                )}
              </div>
              <div className="text-right text-[10px] text-gray-500">{b.note || ""}</div>
            </div>
          </div>
        );
      })}

      <div className="relative h-6 mt-2">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 text-[10px] text-gray-600 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${((t - min) / span) * 100}%` }}
          >
            <div className="h-2 w-px bg-gray-400 mb-1" />
            <span>{t.toFixed(2)} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
