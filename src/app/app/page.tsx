"use client";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import Sparkline from "@/components/charts/Sparkline";
import RangeBars from "@/components/charts/RangeBars";
import DonutTV from "@/components/charts/DonutTV";
import WaterfallEVEquity from "@/components/charts/WaterfallEVEquity";
import WaccBreakdown from "@/components/charts/WaccBreakdown";
import RevenueMargin from "@/components/charts/RevenueMargin";
import Tornado from "@/components/charts/Tornado";
import DcfTable from "@/components/tables/DcfTable";
import PercentSlider from "@/components/forms/PercentSlider";

type Inputs = {
  currency: string;
  revenue0: number;
  growth: number;
  ebitMargin: number;
  taxRate: number;
  capexPct: number;
  nwcPct: number;
  wacc: number;
  gTerm: number;
  years: number;
  netDebt: number;
  sharesOut: number;
  ebitdaMultipleMin?: number;
  ebitdaMultipleMax?: number;
  peMin?: number;
  peMax?: number;
  // advanced
  daPctOfRevenue?: number;
  tvMethod?: "perp" | "exit";
  tvMultiple?: number;
  tvBasis?: "EBIT" | "FCF";
  minorities?: number; associates?: number; pensions?: number; provisions?: number; cashAdjustments?: number;
  leasesCapitalized?: boolean; leaseLiability?: number;
  // wacc detailed (optional)
  riskFree?: number; marketPremium?: number; betaUnlevered?: number; targetLeverage?: number; costOfDebtPreTax?: number; taxRateNorm?: number;
  // working capital policy
  wcPolicy?: "percentDeltaRevenue" | "days";
  dsos?: number; dpo?: number; dsi?: number;
};

const defaultInputs: Inputs = {
  currency: "EUR",
  revenue0: 450,
  growth: 8,
  ebitMargin: 18,
  taxRate: 25,
  capexPct: 3,
  nwcPct: 10,
  wacc: 9,
  gTerm: 2,
  years: 5,
  netDebt: 138,
  sharesOut: 100,
  ebitdaMultipleMin: 7,
  ebitdaMultipleMax: 9,
  peMin: 12,
  peMax: 15,
  daPctOfRevenue: 3,
  tvMethod: 'perp',
  tvBasis: 'FCF',
  minorities: 0, associates: 0, pensions: 0, provisions: 0, cashAdjustments: 0,
  leasesCapitalized: false, leaseLiability: 0,
  riskFree: 2, marketPremium: 5, betaUnlevered: 1, targetLeverage: 30, costOfDebtPreTax: 4, taxRateNorm: 25,
  wcPolicy: 'percentDeltaRevenue', dsos: 45, dpo: 60, dsi: 20,
};

export default function AppPage() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [result, setResult] = useState<any>(null);
  const [tab, setTab] = useState<"KPIs" | "Graphs" | "Table" | "Sensitivity">("KPIs");
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [tornadoRows, setTornadoRows] = useState<Array<{ label: string; low: number; high: number }> | null>(null);
  const [expanded, setExpanded] = useState<null | "sparkline" | "football" | "tornado">(null);
  const hasError = result && result.error;
  const valuation = hasError ? null : result;
  const payload = useMemo(
    () => ({
      ...inputs,
      taxRateNorm: inputs.taxRate ?? inputs.taxRateNorm,
      terminalMethod: inputs.tvMethod === "exit" ? "exitMultiple" : "perpetuity",
      exitMultipleEbitda: inputs.tvMultiple,
    }),
    [inputs]
  );

  useEffect(() => {
    // simple auth guard
    if (!getSession()) {
      window.location.href = "/login";
      return;
    }
    const saved = localStorage.getItem("company");
    if (saved) {
      const obj = JSON.parse(saved);
      setInputs((p) => ({ ...p, currency: obj.currency ?? p.currency }));
      setCompanyName(obj.company || null);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/valuate", { method: "POST", body: JSON.stringify(payload) })
        .then((r) => r.json())
        .then(setResult)
        .catch(() => setResult(null));
    }, 300);
    return () => clearTimeout(t);
  }, [payload]);

  useEffect(() => {
    const t = setTimeout(() => {
      const labels: Record<string, string> = {
        wacc: "WACC",
        gTerm: "g LT",
        ebitMargin: "Marge EBIT",
        growth: "Croissance",
        capexPct: "Capex % CA",
      };
      const deltas = [
        { field: "wacc", low: -1, high: 1, mode: "abs" },
        { field: "gTerm", low: -0.5, high: 0.5, mode: "abs" },
        { field: "ebitMargin", low: -2, high: 2, mode: "abs" },
        { field: "growth", low: -2, high: 2, mode: "abs" },
        { field: "capexPct", low: -1, high: 1, mode: "abs" },
      ];
      fetch("/api/tornado", { method: "POST", body: JSON.stringify({ inputs: payload, deltas }) })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          const rows = Array.isArray(data?.data)
            ? data.data.map((row: any) => ({
                label: labels[row.field as string] ?? row.field,
                low: row.low,
                high: row.high,
              }))
            : null;
          setTornadoRows(rows);
        })
        .catch(() => setTornadoRows(null));
    }, 450);
    return () => clearTimeout(t);
  }, [payload]);

  const fmt = useMemo(
    () => new Intl.NumberFormat("fr-FR", { style: "currency", currency: inputs.currency }),
    [inputs.currency]
  );
  const detail = valuation?.detail ?? valuation ?? null;
  const wacc = detail?.waccDetail ?? valuation?.waccDetail;
  const revenueSeries = detail?.series?.map((r: any) => r.revenue) ?? [];
  const marginSeries = detail?.series?.map((r: any) => (r.revenue ? (r.ebit / r.revenue) * 100 : 0)) ?? [];
  const fcfSeries = (detail ?? valuation)?.series?.map((r: any) => r.fcf) ?? [];
  const pvFcfSeries = (detail ?? valuation)?.series?.map((r: any) => r.pvFcf ?? 0) ?? [];
  const fcfLabels = detail?.series?.map((_: any, idx: number) => `${new Date().getFullYear() + idx + 1}E`) ?? [];
  const bands = valuation?.bands ?? [];
  const tableRows = useMemo(() => {
    const s = (detail ?? valuation)?.series;
    if (!s) return [];
    const tvVal = (detail ?? valuation)?.tv;
    const pvTvVal = (detail ?? valuation)?.pvTV;
    return s.map((r: any, idx: number) => ({
      ...r,
      tv: idx === s.length - 1 ? tvVal : undefined,
      pvTv: idx === s.length - 1 ? pvTvVal : undefined,
    }));
  }, [detail, valuation]);
  const cashFlowRows = useMemo(() => {
    const s = (detail ?? valuation)?.series;
    const cash = (detail ?? valuation)?.cashSeries ?? detail?.cash ?? null;
    const debtSeries = (detail ?? valuation)?.debtSeries ?? null;
    if (!s || !cash || !debtSeries) return [];
    return s.map((_: any, idx: number) => {
      const cashEnd = cash[idx] ?? 0;
      const cashStart = idx === 0 ? 0 : cash[idx - 1] ?? 0;
      const cfo = s[idx]?.cfo ?? 0;
      const capex = s[idx]?.capex ?? 0;
      const cfi = -capex;
      const cff = idx === 0 ? 0 : (debtSeries[idx] ?? 0) - (debtSeries[idx - 1] ?? 0);
      const deltaCash = cashEnd - cashStart;
      const other = deltaCash - (cfo + cfi + cff);
      return { period: idx + 1, cfo, cfi, cff, other, deltaCash, cashEnd };
    });
  }, [detail, valuation]);
  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportSparkline = () => {
    const svg = document.getElementById("sparkline-chart");
    if (!svg) return;
    downloadText("sparkline.svg", svg.outerHTML);
  };
  const exportBands = () => {
    if (!bands || bands.length === 0) return;
    const rows = ["method;low;high"];
    bands.forEach((b: any) => rows.push(`${b.method};${b.low};${b.high}`));
    downloadText("bands.csv", rows.join("\n"));
  };
  const exportTornado = () => {
    if (!tornadoRows || tornadoRows.length === 0) return;
    const rows = ["label;low;high"];
    tornadoRows.forEach((r) => rows.push(`${r.label};${r.low};${r.high}`));
    downloadText("tornado.csv", rows.join("\n"));
  };

  const up = (k: keyof Inputs) => (e: any) => {
    const v = Number(e.target.value);
    setInputs((prev) => ({ ...prev, [k]: isNaN(v) ? 0 : v }));
  };

  return (
    <main className="p-6 w-full max-w-screen-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between bg-white rounded-2xl border border-forest-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-forest-50 border border-forest-100 flex items-center justify-center">
            <img src="/xvalo-logo.svg" alt="XValo" className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-forest-900">Valo Express (local)</h1>
            {companyName && <p className="text-xs text-forest-700">Entreprise : <span className="font-semibold">{companyName}</span></p>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex rounded-lg border border-forest-100 bg-forest-50 overflow-hidden">
            <a className={`px-3 py-1.5 ${tab === "KPIs" || tab === "Graphs" || tab === "Table" || tab === "Sensitivity" ? "bg-forest-600 text-white" : "bg-white text-forest-700"} border-r border-forest-100`} href="/app">
              Page Valo
            </a>
            <a className="px-3 py-1.5 bg-white text-forest-700" href="/analyse">
              Page Analyse
            </a>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        <section className="space-y-4 card md:sticky top-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Entrées</div>
              <h2 className="text-lg font-semibold">Hypothèses clés</h2>
            </div>
            <span className="pill">Compact</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">CA année 0</span>
              <input type="number" className="border rounded px-3 py-2" value={inputs.revenue0} onChange={up('revenue0')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Années</span>
              <input type="number" className="border rounded px-3 py-2" value={inputs.years} onChange={up('years')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Dette nette</span>
              <input type="number" className="border rounded px-3 py-2" value={inputs.netDebt} onChange={up('netDebt')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Actions</span>
              <input type="number" className="border rounded px-3 py-2" value={inputs.sharesOut} onChange={up('sharesOut')} />
            </label>
          </div>

          <div className="grid gap-3">
            <PercentSlider label="Croissance %" value={inputs.growth} onChange={(v)=>setInputs(p=>({ ...p, growth: v }))} min={-20} max={50} />
            <PercentSlider label="Marge EBIT %" value={inputs.ebitMargin} onChange={(v)=>setInputs(p=>({ ...p, ebitMargin: v }))} min={-20} max={60} />
            <PercentSlider label="Tax %" value={inputs.taxRate} onChange={(v)=>setInputs(p=>({ ...p, taxRate: v }))} min={0} max={60} />
            <PercentSlider label="Capex % CA" value={inputs.capexPct} onChange={(v)=>setInputs(p=>({ ...p, capexPct: v }))} min={0} max={30} />
            <PercentSlider label="D&A % CA" value={inputs.daPctOfRevenue ?? 0} onChange={(v)=>setInputs(p=>({ ...p, daPctOfRevenue: v }))} min={0} max={20} />
          </div>

          <div className="bg-forest-50/60 border border-forest-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Politique BFR</div>
              <span className="pill">Cash</span>
            </div>
            <div className="segmented">
              <button className={`seg ${inputs.wcPolicy==='percentDeltaRevenue'?'active':''}`} onClick={()=>setInputs(p=>({ ...p, wcPolicy:'percentDeltaRevenue' }))}>% CA</button>
              <button className={`seg ${inputs.wcPolicy==='days'?'active':''}`} onClick={()=>setInputs(p=>({ ...p, wcPolicy:'days' }))}>Jours</button>
            </div>
            {inputs.wcPolicy==='percentDeltaRevenue' ? (
                <div className="mt-2">
                  <PercentSlider label="BFR % CA" value={inputs.nwcPct} onChange={(v)=>setInputs(p=>({ ...p, nwcPct: v }))} min={-50} max={50} />
                </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mt-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">DSO (jours)</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.dsos ?? 0)} onChange={(e)=>setInputs(p=>({ ...p, dsos: Number(e.target.value) }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">DPO (jours)</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.dpo ?? 0)} onChange={(e)=>setInputs(p=>({ ...p, dpo: Number(e.target.value) }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">DSI (jours)</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.dsi ?? 0)} onChange={(e)=>setInputs(p=>({ ...p, dsi: Number(e.target.value) }))} />
                </label>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <PercentSlider label="WACC %" value={inputs.wacc} onChange={(v)=>setInputs(p=>({ ...p, wacc: v }))} min={0} max={30} />
            <PercentSlider label="g LT %" value={inputs.gTerm} onChange={(v)=>setInputs(p=>({ ...p, gTerm: v }))} min={-5} max={8} />
          </div>

          <details className="border border-forest-100 rounded-xl p-3 bg-white/80">
            <summary className="cursor-pointer text-sm font-medium">Terminal & multiples</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">EV/EBITDA min</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.ebitdaMultipleMin ?? 0)} onChange={up('ebitdaMultipleMin')} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">EV/EBITDA max</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.ebitdaMultipleMax ?? 0)} onChange={up('ebitdaMultipleMax')} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">P/E min</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.peMin ?? 0)} onChange={up('peMin')} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">P/E max</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number(inputs.peMax ?? 0)} onChange={up('peMax')} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="tv" checked={inputs.tvMethod !== 'exit'} onChange={() => setInputs(p=>({ ...p, tvMethod:'perp' }))}/> Perpétuité
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="tv" checked={inputs.tvMethod === 'exit'} onChange={() => setInputs(p=>({ ...p, tvMethod:'exit' }))}/> Multiple de sortie
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-xs text-gray-600">Multiple (si sortie)</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number((inputs as any).tvMultiple ?? 0)} onChange={(e)=> setInputs(p=>({ ...p, tvMultiple: Number(e.target.value) }))} />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-xs text-gray-600">Base du multiple</span>
                  <select className="border rounded px-3 py-2" value={String((inputs as any).tvBasis ?? 'FCF')} onChange={(e)=> setInputs(p=>({ ...p, tvBasis: e.target.value as any }))}>
                    <option value="FCF">FCF</option>
                    <option value="EBIT">EBIT</option>
                  </select>
                </label>
              </div>
            </div>
          </details>

          <details className="border border-forest-100 rounded-xl p-3 bg-white/80">
            <summary className="cursor-pointer text-sm font-medium">Ajustements EV → Equity</summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                ['associates','Associates'],
                ['minorities','Minorities'],
                ['pensions','Pensions'],
                ['provisions','Provisions'],
                ['cashAdjustments','Cash adj.'],
                ['leaseLiability','Lease liability']
              ] as const).map(([k,label]) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">{label}</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number((inputs as any)[k] ?? 0)} onChange={(e)=> setInputs(p=>({ ...p, [k]: Number(e.target.value) } as any))} />
                </label>
              ))}
              <label className="flex items-center gap-2 col-span-2 text-sm">
                <input type="checkbox" checked={!!inputs.leasesCapitalized} onChange={(e)=> setInputs(p=>({ ...p, leasesCapitalized: e.target.checked }))} /> Capitaliser les leases (IFRS 16)
              </label>
            </div>
          </details>

          <details className="border border-forest-100 rounded-xl p-3 bg-white/80">
            <summary className="cursor-pointer text-sm font-medium">WACC détaillé (optionnel)</summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                ['riskFree','Rf %'],
                ['marketPremium','Prime de marché %'],
                ['betaUnlevered','Beta unlevered'],
                ['targetLeverage','Leverage D/(D+E) %'],
                ['costOfDebtPreTax','Kd pré-impôt %'],
                ['taxRateNorm','Tax norm %']
              ] as const).map(([k,label]) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600">{label}</span>
                  <input type="number" className="border rounded px-3 py-2" value={Number((inputs as any)[k] ?? 0)} onChange={(e)=> setInputs(p=>({ ...p, [k]: Number(e.target.value) }))} />
                </label>
              ))}
            </div>
          </details>
        </section>

        <section className="space-y-4">
          <div className="segmented">
            {(["KPIs", "Graphs", "Table", "Sensitivity"] as const).map((t) => (
              <button
                key={t}
                className={`px-3 py-1 rounded border ${
                  tab === t ? "brand-gradient text-white" : "bg-white text-black"
                }`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {valuation && tab === "KPIs" && detail && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card title="EV" value={fmt.format((detail ?? result).ev)} />
              <Card title="Equity" value={fmt.format((detail ?? result).equity)} />
              <Card title="Prix / action" value={`${Number((detail ?? result).price ?? 0).toFixed(2)} ${inputs.currency}`} />
              <Card title="%TV dans EV" value={`${Math.round(100*((detail ?? result).tvSharePct ?? 0))} %`} />
              <Card title="PV explicite / EV" value={`${Math.round(100*((detail ?? result).explicitSharePct ?? 0))} %`} />
            </div>
          )}

          {valuation && tab === "Graphs" && (
            <div className="space-y-4">
              {detail && (
                <section className="card">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                <div className="flex items-center justify-center">
                  <DonutTV tvPct={(detail ?? result).tvSharePct ?? 0} />
                </div>
                <div className="md:col-span-2">
                  <WaterfallEVEquity items={detail.bridges.evToEquity} />
                      </div>
                    </div>
                    <div className="bg-forest-50/60 border border-forest-100 rounded-xl p-3 space-y-2 text-xs text-gray-700 min-w-0">
                      <div className="text-sm font-medium">Liens entrées / outputs</div>
                      <div className="grid grid-cols-2 gap-2 min-w-0">
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>WACC</span><span className="font-semibold text-forest-700">{inputs.wacc}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>g LT</span><span className="font-semibold text-forest-700">{inputs.gTerm}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>Marge EBIT</span><span className="font-semibold text-forest-700">{inputs.ebitMargin}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>Croissance</span><span className="font-semibold text-forest-700">{inputs.growth}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>Capex</span><span className="font-semibold text-forest-700">{inputs.capexPct}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-forest-100 rounded px-2 py-1">
                          <span>Dette nette</span><span className="font-semibold text-forest-700">{fmt.format(inputs.netDebt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
              <section className="grid md:grid-cols-2 gap-4">
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Profil CA & marge</h3>
                    <span className="text-xs text-gray-500">piloté par croissance/marge</span>
                  </div>
                  <RevenueMargin revenue={revenueSeries} marginPct={marginSeries} />
                </div>
                {wacc && wacc.costOfEquity !== undefined && wacc.costOfDebtAfterTax !== undefined && wacc.betaLevered !== undefined && wacc.leverage !== undefined && (
                  <div className="card">
                    <WaccBreakdown {...wacc} />
                  </div>
                )}
              </section>

              <section className="grid md:grid-cols-2 gap-4">
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">FCF sparkline</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>années (prévisions)</span>
                      <button className="px-2 py-1 border rounded bg-white" onClick={() => setExpanded('sparkline')}>Agrandir</button>
                      <button className="px-2 py-1 border rounded bg-white" onClick={exportSparkline}>Exporter</button>
                    </div>
                  </div>
                  <Sparkline
                    id="sparkline-chart"
                    data={fcfSeries}
                    secondary={pvFcfSeries}
                    labels={fcfLabels}
                    unit={inputs.currency}
                    height={200}
                    splitIndex={1}
                  />
                </div>
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Football Field</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>prix / action</span>
                      <button className="px-2 py-1 border rounded bg-white" onClick={() => setExpanded('football')}>Agrandir</button>
                      <button className="px-2 py-1 border rounded bg-white" onClick={exportBands}>Exporter</button>
                    </div>
                  </div>
                  <RangeBars bands={bands} unit={inputs.currency} current={valuation?.price} />
                  {valuation?.price !== undefined && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      Cours actuel pris comme base: {valuation.price.toFixed(2)} {inputs.currency}
                    </div>
                  )}
                </div>
              </section>

              {tornadoRows && tornadoRows.length > 0 && (
                <section className="card overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Sensibilités clés (tornado)</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>impact sur le prix</span>
                      <button className="px-2 py-1 border rounded bg-white" onClick={() => setExpanded('tornado')}>Agrandir</button>
                      <button className="px-2 py-1 border rounded bg-white" onClick={exportTornado}>Exporter</button>
                    </div>
                  </div>
                  <Tornado data={tornadoRows} unit={inputs.currency} base={valuation?.price} />
                </section>
              )}
            </div>
          )}

          {valuation && tab === "Table" && detail && (
            <DcfTable rows={tableRows} totals={{ pvExplicit: (detail ?? valuation).pvExplicit, pvTV: (detail ?? valuation).pvTV, ev: (detail ?? valuation).ev }} />
          )}

          {valuation && tab === "Sensitivity" && (
            <div className="card space-y-3 overflow-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Table de sensibilités</h3>
                <span className="text-xs text-gray-500">prix / action</span>
              </div>
              <div className="overflow-auto rounded-lg border border-forest-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-forest-50 text-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Méthode</th>
                      <th className="text-right px-3 py-2 font-medium">Low</th>
                      <th className="text-right px-3 py-2 font-medium">High</th>
                      <th className="text-right px-3 py-2 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {(valuation.bands ?? []).map((b: any) => {
                      const spread = (b.high ?? 0) - (b.low ?? 0);
                      const isDcf = (b.method || "").toLowerCase().includes("dcf");
                      return (
                        <tr key={b.method} className={isDcf ? "bg-forest-50/60" : ""}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span>{b.method}</span>
                              {isDcf && <span className="pill text-[10px]">WACC ±1pt / gLT ±0.5pt</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{b.low?.toFixed(2)} {inputs.currency}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{b.high?.toFixed(2)} {inputs.currency}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-600">+{spread.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasError && (
            <div className="card text-sm text-red-600">Erreur: {String(result.error)}</div>
          )}
        </section>
      </div>

      {expanded && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agrandir: {expanded}</h3>
              <button className="px-3 py-1 border rounded" onClick={() => setExpanded(null)}>Fermer</button>
            </div>
            {expanded === "sparkline" && (
              <div className="card overflow-hidden">
                <Sparkline data={fcfSeries} secondary={pvFcfSeries} labels={fcfLabels} unit={inputs.currency} height={260} width={1200} />
              </div>
            )}
            {expanded === "football" && (
              <div className="card overflow-hidden">
                <RangeBars bands={bands} unit={inputs.currency} current={valuation?.price} />
              </div>
            )}
            {expanded === "tornado" && tornadoRows && (
              <div className="card overflow-hidden">
                <Tornado data={tornadoRows} unit={inputs.currency} base={valuation?.price} />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}




