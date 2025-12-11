"use client";
import React from "react";

type Row = {
  year: number;
  revenue: number;
  ebit: number;
  da: number;
  capex: number;
  deltaNwc: number;
  nopat: number;
  fcf: number;
  df: number;
  pvFcf: number;
  tv?: number;
  pvTv?: number;
};

export default function DcfTable({ rows, totals }: { rows: Row[]; totals?: { pvExplicit: number; pvTV: number; ev: number } }) {
  const exportCsv = () => {
    const data = [
      ["Année", "CA", "EBIT", "D&A", "NOPAT", "Capex", "Δ BFR", "FCF", "DF (facteur d'actualisation)"],
      ...rows.map((r) => [
        r.year,
        r.revenue,
        r.ebit,
        r.da,
        r.nopat,
        r.capex,
        r.deltaNwc,
        r.fcf,
        Number(r.df.toFixed(4)),
      ]),
    ];
    const csv = data.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcf-table.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 border border-forest-100 rounded-2xl bg-white shadow-sm overflow-auto space-y-3">
      <table className="min-w-[780px] text-sm">
        <thead className="bg-forest-50 text-forest-800">
          <tr className="border-b border-forest-100">
            {["Année", "CA", "EBIT", "D&amp;A", "NOPAT", "Capex", "Δ BFR", "FCF", "DF (facteur d'actualisation)", "PV FCF"].map((h) => (
              <th key={h} className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.year} className={`border-b border-forest-100 ${idx % 2 === 1 ? "bg-forest-50/40" : ""}`}>
              <td className="py-2 px-3 text-gray-800">{r.year}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.revenue).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.ebit).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.da).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.nopat).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.capex).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.deltaNwc).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums font-semibold text-forest-900">{Math.round(r.fcf).toLocaleString("fr-FR")}</td>
              <td className="py-2 px-3 text-right tabular-nums text-gray-800">{r.df.toFixed(3)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-forest-900">{Math.round(r.pvFcf).toLocaleString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totals && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-forest-800 bg-forest-50/70 border border-forest-100 rounded-xl px-3 py-2">
          <div className="text-xs text-gray-600">DF = facteur d’actualisation</div>
          <div className="tabular-nums text-center md:text-right">
            PV explicite&nbsp;: {Math.round(totals.pvExplicit).toLocaleString("fr-FR")} • PV TV&nbsp;: {Math.round(totals.pvTV).toLocaleString("fr-FR")} • EV&nbsp;: {Math.round(totals.ev).toLocaleString("fr-FR")}
          </div>
        </div>
      )}
      <div className="mt-1 text-right">
        <button onClick={exportCsv} className="text-sm underline text-forest-800 hover:text-forest-600">
          Exporter CSV
        </button>
      </div>
    </div>
  );
}
