"use client";
import React from "react";

export default function DonutTV({ tvPct }: { tvPct: number }) {
  const r = 42, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, tvPct));
  const dash = `${c * pct} ${c}`;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" className="bg-white rounded p-2">
      <circle cx={60} cy={60} r={r} stroke="#eee" strokeWidth={12} fill="none" />
      <circle cx={60} cy={60} r={r} stroke="#2A7B59" strokeWidth={12} fill="none" strokeDasharray={dash} transform="rotate(-90 60 60)" />
      <text x={60} y={58} textAnchor="middle" className="text-sm" fill="#111">TV</text>
      <text x={60} y={76} textAnchor="middle" className="text-base" fill="#111">{Math.round(pct*100)}%</text>
    </svg>
  );
}

