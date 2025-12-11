"use client";
import React from "react";

export default function RevenueMargin({ revenue, marginPct }: { revenue: number[]; marginPct: number[] }) {
  const fmt = new Intl.NumberFormat("fr-FR");
  const rows = revenue.map((r, idx) => ({
    year: idx + 1,
    rev: fmt.format(Math.round(r)),
    margin: `${(marginPct[idx] ?? 0).toFixed(1)}%`,
  }));

  return (
    <div className="border rounded p-3 bg-white text-sm">
      <div className="mb-2 font-medium">Revenus &amp; Marge (aperçu)</div>
      <div className="overflow-auto">
        <table className="w-full text-xs md:text-sm border-collapse">
          <thead className="text-gray-600">
            <tr>
              <th className="text-left font-normal pb-1">Année</th>
              <th className="text-right font-normal pb-1">CA</th>
              <th className="text-right font-normal pb-1">Marge EBIT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-100">
            {rows.map((row) => (
              <tr key={row.year}>
                <td className="py-1">Y{row.year}</td>
                <td className="py-1 text-right tabular-nums">{row.rev}</td>
                <td className="py-1 text-right tabular-nums">{row.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
