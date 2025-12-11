"use client";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/session";
import Sparkline from "@/components/charts/Sparkline";

type ParsedTable = { periods: string[]; rows: Record<string, number[]> };
type MetricsRow = { label: string; vals: string[] };

const SAMPLE_BALANCE = `Line item (Bilan);2023A;2024A;2025E
ASSETS / ACTIF;;;
Current assets / Actif courant;;;
Cash and cash equivalents;40;45;50
Trade receivables;80;86;92
Inventories;60;64;68
Other current assets;20;21;22
Total current assets;200;216;232
Non-current assets / Actif non courant;;;
Property, plant & equipment (PPE);250;260;270
Right-of-use assets (IFRS 16);40;42;44
Goodwill;60;60;60
Other intangible assets;50;52;54
Investments & other non-current assets;40;44;48
Total non-current assets;440;458;476
TOTAL ASSETS / TOTAL ACTIF;640;674;708
EQUITY & LIABILITIES / CAPITAUX PROPRES & PASSIF;;;
Equity / Capitaux propres;;;
Share capital;50;50;50
Share premium;80;80;80
Retained earnings;200;240;285
Other equity reserves;10;12;14
Non-controlling interests;5;5;6
Total equity;345;387;435
Non-current liabilities / Passifs non courants;;;
Long-term financial debt;124;120;115
Lease liabilities (non-current);18;17;16
Deferred tax liabilities;14;14;13
Provisions (non-current);12;12;11
Other non-current liabilities;9;9;9
Total non-current liabilities;177;172;164
Current liabilities / Passifs courants;;;
Short-term financial debt;41;40;38
Lease liabilities (current);6;6;5
Trade payables;47;46;44
Current tax liabilities;9;9;9
Other current liabilities;15;14;13
Total current liabilities;118;115;109
TOTAL EQUITY & LIABILITIES / TOTAL CAPITAUX PROPRES & PASSIF;640;674;708`;

const SAMPLE_PNL = `Line item (Compte de resultat);2023A;2024A;2025E
Revenue;420;450;486
Cost of goods sold;-252;-270;-291.6
Gross profit;168;180;194.4
Gross margin (%);40;40;40
Other operating income;3;3;4
Sales & marketing expenses;-40;-42;-44
General & administrative expenses;-30;-31;-32
Research & development expenses;-15;-16;-17
Total operating expenses;-85;-89;-93
EBITDA;86;94;105.4
Depreciation & amortization;-12;-13;-14
EBIT (Operating income);74;81;91.4
Net financial income / (expense);-5;-5;-4
Pre-tax income (EBT);69;76;87.4
Income tax expense;-19.32;-21.28;-24.472
Net income;49.68;54.72;62.928
Net margin (%);11.8286;12.16;12.9481`;

function parseNumber(x: string): number {
  const cleaned = x.replace(/\s+/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseRawTable(raw: string): ParsedTable | null {
  if (!raw.trim()) return null;
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return null;
  const delim = lines[0].includes(";") ? ";" : /\t/;
  const [_, ...periods] = lines[0].split(delim).map((c) => c.trim());
  const rows: Record<string, number[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delim);
    if (cells.length < 2) continue;
    const label = cells[0].trim();
    const values = cells.slice(1).map(parseNumber);
    rows[label.toLowerCase()] = values;
  }
  return { periods, rows };
}

function pick(rows: Record<string, number[]>, keys: string[], fallback = 0): number[] {
  for (const k of keys) {
    const hit = rows[k.toLowerCase()];
    if (hit) return hit;
  }
  return Array(rows[Object.keys(rows)[0]]?.length || 0).fill(fallback);
}

function delta(arr: number[], idx: number): number {
  if (idx === 0) return 0;
  return (arr[idx] ?? 0) - (arr[idx - 1] ?? 0);
}

function BarRow({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const safeMax = max === 0 ? 1 : max;
  const pct = Math.min(100, Math.abs(value) / safeMax * 100);
  const isNeg = value < 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-700">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{value.toFixed(1)}{suffix}</span>
      </div>
      <div className="h-2 rounded bg-forest-100 overflow-hidden">
        <div className={`${isNeg ? "bg-red-400" : "brand-gradient"}`} style={{ width: `${pct}%`, height: "100%" }} />
      </div>
    </div>
  );
}

function severityBadge(value: number, goodMax: number, warnMax: number, inverse = false) {
  const v = Number.isFinite(value) ? value : 0;
  let level: "good" | "warn" | "bad" = "good";
  if (!inverse) {
    if (v > warnMax) level = "bad";
    else if (v > goodMax) level = "warn";
  } else {
    if (v < warnMax) level = "bad";
    else if (v < goodMax) level = "warn";
  }
  const colors: Record<typeof level, string> = {
    good: "bg-green-100 text-green-800",
    warn: "bg-orange-100 text-orange-800",
    bad: "bg-red-100 text-red-800",
  };
  const labels: Record<typeof level, string> = { good: "OK", warn: "Moyen", bad: "Alerte" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colors[level]}`}>{labels[level]}</span>;
}

function Donut({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const total = data.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
  let cumulative = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((d) => {
    const frac = Math.max(0, d.value) / total;
    const dash = frac * circumference;
    const offset = circumference - cumulative;
    cumulative += dash;
    return { dash, offset, color: d.color || "#2a7b59", label: d.label, val: d.value };
  });
  return (
    <div className="flex items-center gap-3">
      <svg width={100} height={100} viewBox="0 0 120 120" className="bg-white rounded">
        <circle cx={60} cy={60} r={radius} stroke="#eee" strokeWidth={12} fill="none" />
        {segments.map((s, idx) => (
          <circle
            key={idx}
            cx={60}
            cy={60}
            r={radius}
            stroke={s.color}
            strokeWidth={12}
            fill="none"
            strokeDasharray={`${s.dash} ${circumference}`}
            strokeDashoffset={s.offset}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text x={60} y={64} textAnchor="middle" className="text-xs" fill="#111">
          100%
        </text>
      </svg>
      <div className="space-y-1 text-xs text-gray-700">
        {data.map((d, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: d.color || "#2a7b59" }} />
            <span>{d.label}</span>
            <span className="tabular-nums font-medium">{d.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalysePage() {
  const [rawBalance, setRawBalance] = useState(SAMPLE_BALANCE);
  const [rawPnl, setRawPnl] = useState(SAMPLE_PNL);
  const [fileName, setFileName] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"tables" | "dashboard">("tables");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showPercentOfSales, setShowPercentOfSales] = useState(false);

  useEffect(() => {
    const ok = getSession();
    if (!ok) {
      window.location.href = "/login";
    } else {
      setAuthed(true);
    }
  }, []);

  const parsed = useMemo(() => {
    const bal = parseRawTable(rawBalance);
    const pnl = parseRawTable(rawPnl);
    if (!bal || !pnl) return null;

    const years = bal.periods.length ? bal.periods : pnl.periods;
    const rowsB = bal.rows;
    const rowsP = pnl.rows;

    const cash = pick(rowsB, ["cash and cash equivalents", "cash"], 0);
    const ar = pick(rowsB, ["trade receivables", "accounts receivable"], 0);
    const inv = pick(rowsB, ["inventories", "stocks"], 0);
    const otherCa = pick(rowsB, ["other current assets"], 0);
    const totalCa = pick(rowsB, ["total current assets"], 0);
    const ap = pick(rowsB, ["trade payables", "accounts payable"], 0);
    const otherCl = pick(rowsB, ["other current liabilities"], 0);
    const taxCl = pick(rowsB, ["current tax liabilities"], 0);
    const stDebt = pick(rowsB, ["short-term financial debt", "short term debt"], 0);
    const ltDebt = pick(rowsB, ["long-term financial debt", "long term debt"], 0);
    const leaseNc = pick(rowsB, ["lease liabilities (non-current)", "lease liabilities"], 0);
    const leaseC = pick(rowsB, ["lease liabilities (current)"], 0);
    const ppe = pick(rowsB, ["property, plant & equipment (ppe)", "ppe"], 0);
    const intang = pick(rowsB, ["other intangible assets", "intangibles"], 0);
    const rou = pick(rowsB, ["right-of-use assets (ifrs 16)", "right of use assets"], 0);
    const goodwill = pick(rowsB, ["goodwill"], 0);
    const totalNca = pick(rowsB, ["total non-current assets"], 0);
    const totalAssets = pick(rowsB, ["total assets / total actif", "total assets"], 0);
    const totalCl = pick(rowsB, ["total current liabilities"], 0);
    const totalNcl = pick(rowsB, ["total non-current liabilities"], 0);
    const totalEquity = pick(rowsB, ["total equity"], 0);
    const debt = stDebt.map((v, idx) => v + (ltDebt[idx] ?? 0) + (leaseNc[idx] ?? 0) + (leaseC[idx] ?? 0));
    const ni = pick(rowsP, ["net income"], 0);
    const netFin = pick(rowsP, ["net financial income / (expense)", "net financial income/(expense)", "net financial income", "financial expense"], 0);
    const ebit = pick(rowsP, ["ebit (operating income)", "ebit"], 0);
    const ebitda = pick(rowsP, ["ebitda"], 0);
    const revenue = pick(rowsP, ["revenue", "sales"], 0);
    const da = pick(rowsP, ["depreciation & amortization", "depreciation", "amortization"], 0);
    const tax = pick(rowsP, ["income tax expense", "tax"], 0);
    const cogs = pick(rowsP, ["cost of goods sold"], 0);

    const periods = years.length ? years : pnl.periods;

    const metrics = periods.map((_, idx) => {
      const wc = (ar[idx] ?? 0) + (inv[idx] ?? 0) + (otherCa[idx] ?? 0) - (ap[idx] ?? 0) - (otherCl[idx] ?? 0) - (taxCl[idx] ?? 0);
      const wcSeries = ar.map((v, i) => (v ?? 0) + (inv[i] ?? 0) + (otherCa[i] ?? 0) - (ap[i] ?? 0) - (otherCl[i] ?? 0) - (taxCl[i] ?? 0));
      const deltaWc = delta(wcSeries, idx);
      const netDebt = (stDebt[idx] ?? 0) + (ltDebt[idx] ?? 0) + (leaseNc[idx] ?? 0) + (leaseC[idx] ?? 0) - (cash[idx] ?? 0);
      const taxRate = revenue[idx] ? Math.abs(tax[idx] ?? 0) / Math.max(1, revenue[idx]) : 0;
      const nopat = (ebit[idx] ?? 0) * (1 - taxRate);
      const investedCapital = (ppe[idx] ?? 0) + (intang[idx] ?? 0) + (rou[idx] ?? 0) + (goodwill[idx] ?? 0) + wc - (cash[idx] ?? 0);
      const roic = investedCapital ? (nopat / investedCapital) * 100 : 0;
      const ebitMargin = revenue[idx] ? ((ebit[idx] ?? 0) / revenue[idx]) * 100 : 0;
      const ebitdaMargin = revenue[idx] ? ((ebitda[idx] ?? 0) / revenue[idx]) * 100 : 0;
      const grossMargin = revenue[idx] ? (((revenue[idx] ?? 0) - Math.abs(cogs[idx] ?? 0)) / revenue[idx]) * 100 : 0;
      const cfo = (ni[idx] ?? 0) + Math.abs(da[idx] ?? 0) - deltaWc;
      const capex = delta(ppe, idx) + delta(intang, idx) + delta(rou, idx);
      const fcf = cfo - capex;
      return { wc, deltaWc, netDebt, roic, ebitMargin, ebitdaMargin, grossMargin, cfo, capex, fcf };
    });

    return {
      periods: periods,
      balanceRows: rowsB,
      pnlRows: rowsP,
      metrics,
      revenue,
      ebit,
      ebitda,
      ni,
      da,
      cash,
      debt,
      netFin,
      totals: {
        currentAssets: totalCa,
        nonCurrentAssets: totalNca,
        totalAssets,
        currentLiabilities: totalCl,
        nonCurrentLiabilities: totalNcl,
        equity: totalEquity,
      },
    };
  }, [rawBalance, rawPnl]);

  const cards: MetricsRow[] = useMemo(() => {
    if (!parsed) return [];
    const p = parsed;
    return [
      { label: "EBIT margin", vals: p.metrics.map((m) => `${m.ebitMargin.toFixed(1)}%`) },
      { label: "EBITDA margin", vals: p.metrics.map((m) => `${m.ebitdaMargin.toFixed(1)}%`) },
      { label: "Gross margin", vals: p.metrics.map((m) => `${m.grossMargin.toFixed(1)}%`) },
      { label: "ROIC", vals: p.metrics.map((m) => `${m.roic.toFixed(1)}%`) },
      { label: "Net debt", vals: p.metrics.map((m) => m.netDebt.toFixed(1)) },
      { label: "FCF", vals: p.metrics.map((m) => m.fcf.toFixed(1)) },
      { label: "FCF yield (rev)", vals: p.metrics.map((m, i) => (p.revenue[i] ? `${((m.fcf / p.revenue[i]) * 100).toFixed(1)}%` : "-")) },
      { label: "CFO/NI", vals: p.metrics.map((m, i) => (p.ni[i] ? `${((m.cfo / p.ni[i]) * 100).toFixed(0)}%` : "-")) },
      { label: "ND/EBITDA", vals: p.metrics.map((m, i) => (p.ebitda[i] ? (m.netDebt / p.ebitda[i]).toFixed(2) : "-")) },
      {
        label: "FCF / Delta Rev",
        vals: p.metrics.map((m, i) => {
          if (i === 0) return "-";
          const dRev = (p.revenue[i] ?? 0) - (p.revenue[i - 1] ?? 0);
          return dRev ? (m.fcf / dRev).toFixed(2) : "-";
        }),
      },
    ];
  }, [parsed]);

  const cashFlowRows = useMemo(() => {
    if (!parsed) return [];
    const cash = parsed.cash ?? [];
    const debt = parsed.debt ?? [];
    return parsed.periods.map((p, idx) => {
      const cashEnd = cash[idx] ?? 0;
      const cashStart = idx === 0 ? 0 : cash[idx - 1] ?? 0;
      const cfo = parsed.metrics[idx]?.cfo ?? 0;
      const cfi = -(parsed.metrics[idx]?.capex ?? 0);
      const cff = idx === 0 ? 0 : (debt[idx] ?? 0) - (debt[idx - 1] ?? 0);
      const deltaCash = cashEnd - cashStart;
      const other = deltaCash - (cfo + cfi + cff);
      return { period: p, cfo, cfi, cff, other, deltaCash, cashEnd };
    });
  }, [parsed]);

  useEffect(() => {
    if (parsed && parsed.periods.length) {
      setSelectedIdx(parsed.periods.length - 1);
    }
  }, [parsed]);

  const summary = useMemo(() => {
    if (!parsed) return null;
    const idx = selectedIdx ?? parsed.periods.length - 1;
    const prev = idx > 0 ? idx - 1 : idx;
    const growth = parsed.revenue[prev] ? ((parsed.revenue[idx] - parsed.revenue[prev]) / parsed.revenue[prev]) * 100 : 0;
    const ebitMargin = parsed.metrics[idx]?.ebitMargin ?? 0;
    const ebitMarginPrev = parsed.metrics[prev]?.ebitMargin ?? ebitMargin;
    const ebitDelta = ebitMargin - ebitMarginPrev;
    const ndEbitda = parsed.ebitda[idx] ? (parsed.metrics[idx]?.netDebt ?? 0) / parsed.ebitda[idx] : 0;
    const ndLabel = ndEbitda < 2 ? "safe" : ndEbitda < 3 ? "medium" : "high";
    return { growth, ebitMargin, ebitDelta, ndEbitda, ndLabel, period: parsed.periods[idx] };
  }, [parsed, selectedIdx]);

  const exportCsv = (name: string, header: string[], rows: Array<string[]>) => {
    const lines = [header.join(";"), ...rows.map((r) => r.join(";"))];
    downloadText(name, lines.join("\n"));
  };

  const exportPnl = () => {
    if (!parsed) return;
    const header = ["Poste", ...parsed.periods];
    const rows = Object.entries(parsed.pnlRows).map(([label, vals]) => [label, ...vals.map((v) => v.toString())]);
    exportCsv("pnl_clean.csv", header, rows);
  };

  const exportBalance = () => {
    if (!parsed) return;
    const header = ["Poste", ...parsed.periods];
    const rows = Object.entries(parsed.balanceRows).map(([label, vals]) => [label, ...vals.map((v) => v.toString())]);
    exportCsv("bilan_clean.csv", header, rows);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetNames = wb.SheetNames;
    if (!sheetNames.length) return;
    const csvFromSheet = (sheet: XLSX.WorkSheet) => XLSX.utils.sheet_to_csv(sheet, { FS: ";" }).trim();
    const first = csvFromSheet(wb.Sheets[sheetNames[0]]);
    const second = sheetNames[1] ? csvFromSheet(wb.Sheets[sheetNames[1]]) : null;
    const isBalance = first.toLowerCase().includes("assets") || first.toLowerCase().includes("actif");
    if (isBalance && second) {
      setRawBalance(first);
      setRawPnl(second);
    } else if (second) {
      setRawPnl(first);
      setRawBalance(second);
    } else {
      setRawBalance(first);
      setRawPnl(first);
    }
  };

  if (!authed) return null;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6 bg-gradient-to-b from-forest-50 to-white rounded-3xl">
            <header className="flex flex-wrap items-start justify-between gap-3 bg-white/80 rounded-2xl p-4 shadow-sm border border-forest-100/60">
        <div className="space-y-1">
          <p className="text-xs uppercase text-gray-500">Analyse</p>
          <h1 className="text-2xl font-bold">Import Bilan & PnL</h1>
          <p className="text-sm text-gray-600">Choisissez un fichier Excel (deux feuilles : Bilan puis PnL) ou collez vos tableaux.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <a className="px-3 py-1 border rounded bg-white text-sm hover:bg-forest-50" href="/app">Retour Valo</a>
          <button
            className="btn btn-outline"
            onClick={() => {
              const payload = { balance: rawBalance, pnl: rawPnl, cashFlow: cashFlowRows };
              try {
                localStorage.setItem("analysisPush", JSON.stringify(payload));
                alert("Donnees envoyees vers la page Valo (localStorage.analysisPush)");
              } catch {}
            }}
          >
            Push vers Valo
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              setRawBalance(SAMPLE_BALANCE);
              setRawPnl(SAMPLE_PNL);
              setFileName(null);
            }}
          >
            Charger l exemple
          </button>
          <label className="btn btn-primary cursor-pointer">
            Importer Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {fileName && <span className="text-xs text-gray-500">Fichier: {fileName}</span>}
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-2 bg-forest-50/50 border-forest-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Coller le Bilan</h3>
            <span className="pill bg-white">CSV/Excel</span>
          </div>
          <textarea
            className="w-full min-h-[240px] border rounded px-3 py-2 font-mono text-xs focus-ring bg-white"
            value={rawBalance}
            onChange={(e) => setRawBalance(e.target.value)}
            placeholder="Collez ici la feuille Bilan (sÃ©parateur ; ou tab)"
          />
        </div>
        <div className="card space-y-2 bg-forest-50/50 border-forest-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Coller le PnL</h3>
            <span className="pill bg-white">CSV/Excel</span>
          </div>
          <textarea
            className="w-full min-h-[240px] border rounded px-3 py-2 font-mono text-xs focus-ring bg-white"
            value={rawPnl}
            onChange={(e) => setRawPnl(e.target.value)}
            placeholder="Collez ici la feuille PnL"
          />
        </div>
      </section>

      {parsed && (
        <section className="space-y-4">
          <div className="segmented">
            {(["tables", "dashboard"] as const).map((t) => (
              <button
                key={t}
                className={`seg ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "tables" ? "Tables" : "Tableau de bord"}
              </button>
            ))}
          </div>

          {tab === "tables" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="card space-y-2 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-forest-700">Ratios clefs</h4>
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left px-2 py-1">Ratio</th>
                          {parsed.periods.map((p) => (
                            <th key={p} className="text-right px-2 py-1">
                              {p}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {cards.map((row) => (
                          <tr key={row.label}>
                            <td className="px-2 py-1 text-gray-700">{row.label}</td>
                            {row.vals.map((v, idx) => (
                              <td key={idx} className="px-2 py-1 text-right tabular-nums">
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card space-y-2 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-forest-700">Cash flow (indirect)</h4>
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left px-2 py-1">Item</th>
                          {parsed.periods.map((p) => (
                            <th key={p} className="text-right px-2 py-1">
                              {p}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {[
                          { label: "Net income", key: "ni" },
                          { label: "D&A", key: "da" },
                          { label: "Delta BFR", key: "deltaWc" },
                          { label: "CFO", key: "cfo" },
                          { label: "Capex (net)", key: "capex" },
                          { label: "FCF", key: "fcf" },
                        ].map((row) => (
                          <tr key={row.label}>
                            <td className="px-2 py-1 text-gray-700">{row.label}</td>
                            {parsed.metrics.map((m, idx) => {
                              const val =
                                row.key === "ni"
                                  ? parsed.ni[idx] ?? 0
                                  : row.key === "da"
                                  ? Math.abs(parsed.da[idx] ?? 0)
                                  : (m as any)[row.key] ?? 0;
                              return (
                                <td key={idx} className="px-2 py-1 text-right tabular-nums">
                                  {val.toFixed(1)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card space-y-2 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-forest-700">Structure bilancielle</h4>
                  <div className="grid gap-2 text-sm">
                    {parsed.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-forest-100 rounded px-3 py-2 bg-forest-50/70">
                        <span className="font-medium text-forest-700">{parsed.periods[idx]}</span>
                        <div className="text-right text-xs space-y-0.5">
                          <div>
                            Net debt: <span className="tabular-nums font-medium">{m.netDebt.toFixed(1)}</span>
                          </div>
                          <div>
                            WC: <span className="tabular-nums font-medium">{m.wc.toFixed(1)}</span>
                          </div>
                          <div>
                            ND/EBITDA:{" "}
                            <span className="tabular-nums font-medium">
                              {parsed.ebitda[idx] ? (m.netDebt / parsed.ebitda[idx]).toFixed(2) : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card space-y-2 overflow-auto bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-forest-700">PnL clean</h4>
                  <button className="px-2 py-1 text-xs border rounded bg-forest-50" onClick={exportPnl}>Exporter CSV</button>
                </div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 bg-forest-50 text-forest-700 rounded-l">Poste</th>
                      {parsed.periods.map((p) => (
                        <th key={p} className="text-right px-3 py-2 bg-forest-50 text-forest-700">
                          {p}
                        </th>
                      ))}
                      <th className="bg-forest-50 rounded-r"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {Object.entries(parsed.pnlRows).map(([label, vals]) => (
                      <tr key={label} className="hover:bg-forest-50/60">
                        <td className="px-3 py-2 text-gray-800 font-medium capitalize">{label}</td>
                        {vals.map((v, idx) => (
                          <td key={idx} className={`px-3 py-2 text-right tabular-nums ${v < 0 ? "text-red-500" : "text-forest-800"}`}>
                            {v.toFixed(1)}
                          </td>
                        ))}
                        <td className="px-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card space-y-2 overflow-auto bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-forest-700">Bilan clean</h4>
                  <button className="px-2 py-1 text-xs border rounded bg-forest-50" onClick={exportBalance}>Exporter CSV</button>
                </div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 bg-forest-50 text-forest-700 rounded-l">Poste</th>
                      {parsed.periods.map((p) => (
                        <th key={p} className="text-right px-3 py-2 bg-forest-50 text-forest-700">
                          {p}
                        </th>
                      ))}
                      <th className="bg-forest-50 rounded-r"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {Object.entries(parsed.balanceRows).map(([label, vals]) => {
                      const isSection = vals.every((v) => v === 0);
                      if (isSection) {
                        return (
                          <tr key={label} className="bg-forest-50/70">
                            <td colSpan={parsed.periods.length + 2} className="px-3 py-2 text-forest-700 font-semibold uppercase tracking-wide">
                              {label}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={label} className="hover:bg-forest-50/60">
                          <td className="px-3 py-2 text-gray-800 font-medium">{label}</td>
                          {vals.map((v, idx) => (
                            <td key={idx} className={`px-3 py-2 text-right tabular-nums ${v < 0 ? "text-red-500" : "text-forest-800"}`}>
                              {v.toFixed(1)}
                            </td>
                          ))}
                          <td className="px-2"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card space-y-2 overflow-auto bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-forest-700">Cash flow statement</h4>
                </div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 bg-forest-50 text-forest-700 rounded-l">Periode</th>
                      {["CFO", "CFI (Capex)", "CFF (dette)", "Autres", "Delta Cash", "Cash fin"].map((h) => (
                        <th key={h} className="text-right px-3 py-2 bg-forest-50 text-forest-700">
                          {h}
                        </th>
                      ))}
                      <th className="bg-forest-50 rounded-r"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {cashFlowRows.map((r) => (
                      <tr key={r.period} className="hover:bg-forest-50/60">
                        <td className="px-3 py-2 text-gray-800 font-medium">{r.period}</td>
                        {[r.cfo, r.cfi, r.cff, r.other, r.deltaCash, r.cashEnd].map((v, idx) => (
                          <td key={idx} className={`px-3 py-2 text-right tabular-nums ${v < 0 ? "text-red-500" : "text-forest-800"}`}>
                            {v.toFixed(1)}
                          </td>
                        ))}
                        <td className="px-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="card bg-white shadow-sm px-3 py-2">
                  <div className="text-sm font-semibold text-forest-700">Résumé ({summary?.period ?? ""})</div>
                  <ul className="text-xs text-gray-700 space-y-1 mt-1">
                    {summary && (
                      <>
                        <li>Croissance CA vs N-1 : {summary.growth.toFixed(1)}%</li>
                        <li>EBIT margin : {summary.ebitMargin.toFixed(1)}% ({summary.ebitDelta >= 0 ? "+ " : "- "}{Math.abs(summary.ebitDelta).toFixed(1)} pts)</li>
                        <li className="flex items-center gap-2">
                          <span>ND/EBITDA : {summary.ndEbitda.toFixed(1)}x</span>
                          {severityBadge(summary.ndEbitda, 2, 3)}
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span>Période :</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={selectedIdx ?? parsed.periods.length - 1}
                      onChange={(e) => setSelectedIdx(Number(e.target.value))}
                    >
                      {parsed?.periods.map((p, idx) => (
                        <option key={p} value={idx}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={showPercentOfSales} onChange={(e)=>setShowPercentOfSales(e.target.checked)} />
                    Nominal / % CA
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card bg-white shadow-sm">
                  <div className="text-sm font-semibold text-forest-700 mb-2">CA (tendance, en M€)</div>
                  <Sparkline data={parsed.revenue} labels={parsed.periods} height={120} />
                </div>
                <div className="card bg-white shadow-sm">
                    <div className="text-sm font-semibold text-forest-700 mb-2">EBIT (tendance, en M€)</div>
                  <Sparkline data={parsed.ebit} labels={parsed.periods} height={120} />
                </div>
                <div className="card bg-white shadow-sm">
                    <div className="text-sm font-semibold text-forest-700 mb-2">FCF (tendance, en M€)</div>
                  <Sparkline data={parsed.metrics.map((m) => m.fcf)} labels={parsed.periods} height={120} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {(() => {
                  const series = [
                    { label: "Chiffre d'affaires (en M€)", vals: parsed.revenue },
                    { label: "EBIT (en M€)", vals: parsed.ebit },
                    { label: "FCF (en M€)", vals: parsed.metrics.map((m) => m.fcf) },
                  ];
                  const commonMax = Math.max(...series.flatMap((s) => s.vals));
                  return series.map((blk) => (
                    <div key={blk.label} className="card bg-white shadow-sm">
                      <div className="text-sm font-semibold text-forest-700 mb-2">{blk.label}</div>
                      <div className="space-y-2">
                        {blk.vals.map((v, idx) => {
                          const prev = idx > 0 ? blk.vals[idx - 1] : blk.vals[idx];
                          const deltaPct = prev ? ((v - prev) / prev) * 100 : 0;
                          const arrow = deltaPct >= 0 ? "↑" : "↓";
                          return (
                            <div key={idx}>
                              <BarRow label={`${parsed.periods[idx]} (${arrow}${Math.abs(deltaPct).toFixed(1)}%)`} value={v} max={commonMax} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="card bg-white shadow-sm">
                  <div className="text-sm font-semibold text-forest-700 mb-2">Marge & ROIC</div>
                  <div className="space-y-2">
                {["EBIT margin", "EBITDA margin", "Gross margin", "ROIC"].map((label, idx) => {
                  const key = ["ebitMargin", "ebitdaMargin", "grossMargin", "roic"][idx] as keyof typeof parsed.metrics[number];
                  return (
                  <BarRow
                    key={label}
                    label={label}
                    value={parsed.metrics[parsed.metrics.length - 1][key] as number}
                    max={100}
                    suffix="%"
                  />
                );})}
                  </div>
                </div>
                <div className="card bg-white shadow-sm">
                  <div className="text-sm font-semibold text-forest-700 mb-2">Cash & dette</div>
                  <div className="space-y-2">
                    <BarRow label="Net debt (last)" value={parsed.metrics.at(-1)?.netDebt ?? 0} max={Math.max(...parsed.metrics.map((m) => Math.abs(m.netDebt)))} />
                    <BarRow label="CFO (last)" value={parsed.metrics.at(-1)?.cfo ?? 0} max={Math.max(...parsed.metrics.map((m) => Math.abs(m.cfo)))} />
                    <BarRow label="WC (last)" value={parsed.metrics.at(-1)?.wc ?? 0} max={Math.max(...parsed.metrics.map((m) => Math.abs(m.wc)))} />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="card bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-forest-700">Liquidité (last)</div>
                    <div className="text-xs text-gray-500">CA/CL</div>
                  </div>
                  {(() => {
                    const last = parsed.periods.length - 1;
                    const ca = parsed.totals.currentAssets[last] ?? 0;
                    const cl = parsed.totals.currentLiabilities[last] ?? 1;
                    const qr =
                      ((parsed.balanceRows["cash and cash equivalents"]?.[last] ?? 0) +
                        (parsed.balanceRows["trade receivables"]?.[last] ?? 0) +
                        (parsed.balanceRows["other current assets"]?.[last] ?? 0)) /
                      cl;
                    return (
                      <div className="space-y-2">
                        <BarRow label="Current ratio" value={ca / cl} max={3} />
                        <BarRow label="Quick ratio" value={qr} max={3} />
                        <div className="text-xs text-gray-600 mt-2">
                          Actif courant {ca.toFixed(1)} / Passif courant {cl.toFixed(1)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="card bg-white shadow-sm">
                  <div className="text-sm font-semibold text-forest-700 mb-2">Structure (last)</div>
                  {(() => {
                    const last = parsed.periods.length - 1;
                    const debt = (parsed.balanceRows["long-term financial debt"]?.[last] ?? 0) + (parsed.balanceRows["short-term financial debt"]?.[last] ?? 0) + (parsed.balanceRows["lease liabilities (non-current)"]?.[last] ?? 0) + (parsed.balanceRows["lease liabilities (current)"]?.[last] ?? 0);
                    const eq = parsed.totals.equity[last] ?? 0;
                    const cov = Math.abs(parsed.netFin[last] ?? 0) ? (parsed.ebit[last] ?? 0) / Math.abs(parsed.netFin[last] ?? 0) : 0;
                    const ndEbitda = parsed.ebitda[last] ? (parsed.metrics[last]?.netDebt ?? 0) / parsed.ebitda[last] : 0;
                    const color = ndEbitda < 2 ? "#22c55e" : ndEbitda < 3 ? "#f97316" : "#ef4444";
                    return (
                      <div className="space-y-2">
                        <BarRow label="Debt/Equity" value={eq ? debt / eq : 0} max={3} />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-700">
                            <span>ND/EBITDA</span>
                            <span className="tabular-nums font-medium flex items-center gap-1" style={{ color }}>
                              {ndEbitda.toFixed(1)}x
                              {severityBadge(ndEbitda, 2, 3)}
                            </span>
                          </div>
                          <div className="h-2 rounded bg-forest-100 overflow-hidden">
                            <div className="h-2" style={{ width: `${Math.min(100, (ndEbitda / 5) * 100)}%`, background: color }} />
                          </div>
                        </div>
                        <BarRow label="Couverture intérêts" value={cov} max={10} />
                        <div className="text-xs text-gray-600 mt-2">
                          Dette {debt.toFixed(1)} / Equity {eq.toFixed(1)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="card bg-white shadow-sm">
                  <div className="text-sm font-semibold text-forest-700 mb-2">Profil de cash (last)</div>
                  {(() => {
                    const last = parsed.periods.length - 1;
                    const ni = parsed.ni[last] ?? 0;
                    const cfo = parsed.metrics[last]?.cfo ?? 0;
                    const fcf = parsed.metrics[last]?.fcf ?? 0;
                    const ca = parsed.revenue[last] ?? 0;
                    const capex = parsed.metrics[last]?.capex ?? 0;
                    const denom = showPercentOfSales && ca ? ca : 1;
                    const fcfVal = showPercentOfSales && ca ? (fcf / ca) * 100 : fcf;
                    const cfoVal = showPercentOfSales && ca ? (cfo / ca) * 100 : cfo;
                    const capexVal = showPercentOfSales && ca ? (capex / ca) * 100 : capex;
                    const suffix = showPercentOfSales ? "%" : "";
                    return (
                      <div className="space-y-2">
                        <BarRow label="CFO" value={cfoVal} max={showPercentOfSales ? 50 : Math.max(cfo, capex, fcf, 1)} suffix={suffix} />
                        <BarRow label="FCF" value={fcfVal} max={showPercentOfSales ? 50 : Math.max(cfo, capex, fcf, 1)} suffix={suffix} />
                        <BarRow label="Capex" value={capexVal} max={showPercentOfSales ? 50 : Math.max(cfo, capex, fcf, 1)} suffix={suffix} />
                        <div className="text-xs text-gray-600 mt-2">
                          CFO {cfo.toFixed(1)} / Capex {Math.abs(capex).toFixed(1)} {showPercentOfSales ? "% du CA" : ""}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}










