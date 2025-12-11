// Canonical valuation engine (DCF + sensibilités) implemented as pure utilities.

export type NwcPolicy = "percentDeltaRevenue" | "days";

export type DcfInputs = {
  currency?: string;

  // Revenus & marges
  revenue0: number;
  growth: number; // %
  revenuePlan?: number[]; // t=1..N
  ebitMargin: number; // %
  ebitMarginPlan?: number[]; // %

  // D&A, Capex
  daPctOfRevenue?: number; // %
  daPlan?: number[];
  capexPct?: number; // %
  capexPlan?: number[];

  // BFR
  wcPolicy: NwcPolicy;
  nwcPct?: number; // % du delta CA
  dso?: number;
  dpo?: number;
  dsi?: number;

  // Fiscalité & WACC
  taxRateNorm: number; // %
  wacc?: number; // % direct
  riskFree?: number;
  marketPremium?: number;
  countryRiskPremium?: number;
  smallCapPremium?: number;
  betaUnlevered?: number;
  targetLeverage?: number; // D/(D+E) en %
  costOfDebtPreTax?: number; // %

  // Horizon & terminal
  years: number;
  terminalMethod: "perpetuity" | "exitMultiple";
  gTerm?: number; // %
  exitMultipleEbitda?: number; // x

  // Bridge EV → Equity
  netDebt: number;
  minorities?: number;
  associates?: number;
  pensions?: number;
  provisions?: number;
  cashAdjustments?: number;
  leasesCapitalized?: boolean;
  leaseLiability?: number;

  // Capitaux propres
  sharesOut: number;

  // Multiples (football field)
  ebitdaMultipleMin?: number;
  ebitdaMultipleMax?: number;
  peMin?: number;
  peMax?: number;

  // Options
  clampGtLtWacc?: boolean;
};

export type YearRow = {
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
  ebitda: number;
};

export type WaccDetail = {
  usedDirectWacc: boolean;
  wacc: number; // %
  costOfEquity?: number; // %
  costOfDebtPreTax?: number; // %
  costOfDebtAfterTax?: number; // %
  betaUnlevered?: number;
  betaLevered?: number;
  leverage?: number; // D/(D+E)
  premiumComponents?: {
    market: number;
    country?: number;
    smallCap?: number;
    costOfDebtPreTax?: number;
    taxRate?: number;
    riskFree?: number;
  };
  riskFree?: number;
};

export type ValuationOutput = {
  series: YearRow[];
  tv: number;
  pvTV: number;
  pvExplicit: number;
  ev: number;
  equity: number;
  price: number;
  tvSharePct: number;
  explicitSharePct: number;
  waccDetail: WaccDetail;
  bridges: { evToEquity: { label: string; value: number }[] };
  bands: { method: string; low: number; high: number }[];
  notes: string[];
};

const pct = (x: number | undefined) => (Number.isFinite(x as number) ? (x as number) / 100 : 0);
const safe = (x: number | undefined) => (Number.isFinite(x as number) ? (x as number) : 0);

function enforceSharesOut(sharesOut: number): void {
  if (!(sharesOut > 0)) {
    throw new Error("sharesOut must be > 0");
  }
}

function enforceWaccPositive(waccPct: number): void {
  if (!(waccPct > 0)) {
    throw new Error("WACC must be > 0");
  }
}

export function buildWaccDetail(i: DcfInputs): WaccDetail {
  const directWaccPct = i.wacc;
  if (Number.isFinite(directWaccPct)) {
    enforceWaccPositive(directWaccPct!);
    return { usedDirectWacc: true, wacc: directWaccPct! };
  }

  const leverage = Math.min(0.95, Math.max(0, pct(i.targetLeverage)));
  const deRatio = leverage > 0.999999 ? 99 : leverage / Math.max(1e-6, 1 - leverage);
  const betaU = safe(i.betaUnlevered) || 1;
  const betaL = betaU * (1 + (1 - pct(i.taxRateNorm)) * deRatio); // Hamada
  const premium = safe(i.marketPremium) + safe(i.countryRiskPremium) + safe(i.smallCapPremium);
  const costOfEquity = safe(i.riskFree) + betaL * premium;
  const costOfDebtPreTax = safe(i.costOfDebtPreTax);
  const costOfDebtAfterTax = costOfDebtPreTax * (1 - pct(i.taxRateNorm));
  const waccDec = costOfEquity * (1 - leverage) + costOfDebtAfterTax * leverage;
  const waccPct = waccDec * 100;
  enforceWaccPositive(waccPct);

  return {
    usedDirectWacc: false,
    wacc: waccPct,
    costOfEquity: costOfEquity * 100,
    costOfDebtPreTax: costOfDebtPreTax * 100,
    costOfDebtAfterTax: costOfDebtAfterTax * 100,
    betaUnlevered: betaU,
    betaLevered: betaL,
    leverage,
    premiumComponents: {
      market: safe(i.marketPremium),
      country: i.countryRiskPremium,
      smallCap: i.smallCapPremium,
      costOfDebtPreTax: costOfDebtPreTax * 100,
      taxRate: i.taxRateNorm,
      riskFree: i.riskFree,
    },
    riskFree: i.riskFree,
  };
}

function buildRevenues(i: DcfInputs, years: number): number[] {
  const rev: number[] = [];
  if (i.revenuePlan && i.revenuePlan.length >= years) {
    for (let t = 0; t < years; t++) rev[t] = safe(i.revenuePlan[t]);
    return rev;
  }
  const g = pct(i.growth);
  let prev = i.revenue0;
  for (let t = 0; t < years; t++) {
    const next = prev * (1 + g);
    rev[t] = next;
    prev = next;
  }
  return rev;
}

function computeDeltaNwcPercent(revenue: number[], revenue0: number, nwcPct: number, t: number): number {
  const deltaRev = t === 0 ? revenue[0] - revenue0 : revenue[t] - revenue[t - 1];
  return deltaRev * nwcPct;
}

function computeNwcDays(
  revenue: number[],
  ebit: number[],
  da: number[],
  dso: number,
  dpo: number,
  dsi: number,
  revenue0: number,
  ebitMargin0: number,
  daPct0: number
): { delta: number; prevLevel: number; level: number }[] {
  const result: { delta: number; prevLevel: number; level: number }[] = [];
  const cogs0 = Math.max(0, revenue0 - revenue0 * ebitMargin0 - revenue0 * daPct0);
  const nwc0 = revenue0 * (dso / 365) + cogs0 * (dsi / 365) - cogs0 * (dpo / 365);

  for (let t = 0; t < revenue.length; t++) {
    const cogs = Math.max(0, revenue[t] - ebit[t] - da[t]); // Capex maintenance approx set to 0
    const ar = revenue[t] * (dso / 365);
    const inv = cogs * (dsi / 365);
    const ap = cogs * (dpo / 365);
    const level = ar + inv - ap;
    const prevLevel = t === 0 ? nwc0 : result[t - 1].level;
    const delta = level - prevLevel;
    result[t] = { delta, prevLevel, level };
  }
  return result;
}

export function buildSchedules(
  i: DcfInputs,
  waccPct: number
): { rows: YearRow[]; tv: number; pvExplicit: number; pvTV: number; ev: number } {
  const years = Math.max(1, Math.round(i.years));
  enforceSharesOut(i.sharesOut);
  enforceWaccPositive(waccPct);
  const wacc = waccPct / 100;

  const revenue = buildRevenues(i, years);
  const ebit: number[] = [];
  const da: number[] = [];
  const capex: number[] = [];

  for (let t = 0; t < years; t++) {
    const marginPct = i.ebitMarginPlan && Number.isFinite(i.ebitMarginPlan[t]) ? pct(i.ebitMarginPlan[t]) : pct(i.ebitMargin);
    ebit[t] = revenue[t] * marginPct;
    const daPlanVal = i.daPlan && Number.isFinite(i.daPlan[t]) ? safe(i.daPlan[t]) : revenue[t] * pct(i.daPctOfRevenue);
    da[t] = daPlanVal;
    const capexVal = i.capexPlan && Number.isFinite(i.capexPlan[t]) ? safe(i.capexPlan[t]) : revenue[t] * pct(i.capexPct);
    capex[t] = capexVal;
  }

  const useDays =
    i.wcPolicy === "days" &&
    Number.isFinite(i.dso) &&
    Number.isFinite(i.dpo) &&
    Number.isFinite(i.dsi) &&
    i.dso !== undefined &&
    i.dpo !== undefined &&
    i.dsi !== undefined;

  const deltaNwcDays = useDays
    ? computeNwcDays(
        revenue,
        ebit,
        da,
        safe(i.dso),
        safe(i.dpo),
        safe(i.dsi),
        i.revenue0,
        i.ebitMarginPlan && Number.isFinite(i.ebitMarginPlan[0]) ? pct(i.ebitMarginPlan[0]) : pct(i.ebitMargin),
        pct(i.daPctOfRevenue)
      )
    : [];

  const rows: YearRow[] = [];
  const dfs: number[] = [];
  let pvExplicit = 0;

  for (let t = 0; t < years; t++) {
    const deltaNwc = useDays ? deltaNwcDays[t].delta : computeDeltaNwcPercent(revenue, i.revenue0, pct(i.nwcPct), t);
    const nopat = ebit[t] * (1 - pct(i.taxRateNorm));
    const fcf = nopat + da[t] - capex[t] - deltaNwc;
    const df = 1 / Math.pow(1 + wacc, t + 1);
    const pvFcf = fcf * df;
    dfs[t] = df;
    pvExplicit += pvFcf;
    rows.push({
      year: t + 1,
      revenue: revenue[t],
      ebit: ebit[t],
      da: da[t],
      capex: capex[t],
      deltaNwc,
      nopat,
      fcf,
      df,
      pvFcf,
      ebitda: ebit[t] + da[t],
    });
  }

  const gLT = pct(i.gTerm);
  let appliedClamp = false;
  let gForTv = gLT;
  if (i.terminalMethod === "perpetuity") {
    if (i.clampGtLtWacc && gForTv >= wacc) {
      gForTv = wacc - 0.001; // small cushion to avoid div by ~0
      appliedClamp = true;
    } else if (gForTv >= wacc) {
      throw new Error("gLT must be < WACC for perpetuity");
    }
  }

  let tv = 0;
  if (i.terminalMethod === "perpetuity") {
    const fcfInf = rows[years - 1].fcf * (1 + gForTv);
    tv = fcfInf / (wacc - gForTv);
  } else {
    const exitMultiple = safe(i.exitMultipleEbitda);
    const ebitdaN = rows[years - 1].ebitda;
    tv = ebitdaN * exitMultiple;
  }

  const pvTV = tv * dfs[years - 1];
  const ev = pvExplicit + pvTV;

  if (appliedClamp) {
    // eslint-disable-next-line no-console
    console.warn("gLT clamped to stay below WACC");
  }

  return { rows, tv, pvExplicit, pvTV, ev };
}

function bridgeToEquity(i: DcfInputs, ev: number): { equity: number; price: number; bridge: { label: string; value: number }[] } {
  enforceSharesOut(i.sharesOut);
  const minorities = safe(i.minorities);
  const associates = safe(i.associates);
  const pensions = safe(i.pensions);
  const provisions = safe(i.provisions);
  const cashAdj = safe(i.cashAdjustments);
  const leaseAdj = i.leasesCapitalized ? safe(i.leaseLiability) : 0;

  const equity =
    ev -
    i.netDebt -
    minorities +
    associates -
    pensions -
    provisions +
    cashAdj -
    leaseAdj;
  const price = equity / i.sharesOut;

  const bridge = [
    { label: "EV", value: ev },
    { label: "- NetDebt", value: -i.netDebt },
    { label: "- Minorities", value: -minorities },
    { label: "+ Associates", value: associates },
    { label: "- Pensions", value: -pensions },
    { label: "- Provisions", value: -provisions },
    { label: "+ CashAdjustments", value: cashAdj },
    { label: i.leasesCapitalized ? "- LeaseLiability" : "LeaseLiability (off)", value: -leaseAdj },
  ];

  return { equity, price, bridge };
}

type ValuationBase = Omit<ValuationOutput, "bands">;

function computeValuationBase(i: DcfInputs): ValuationBase {
  const waccDetail = buildWaccDetail(i);
  const schedules = buildSchedules(i, waccDetail.wacc);
  const { equity, price, bridge } = bridgeToEquity(i, schedules.ev);

  const tvSharePct = schedules.ev ? schedules.pvTV / schedules.ev : 0;
  const explicitSharePct = schedules.ev ? schedules.pvExplicit / schedules.ev : 0;

  const notes: string[] = [];
  if (i.terminalMethod === "perpetuity" && i.clampGtLtWacc && i.gTerm !== undefined && i.gTerm / 100 >= waccDetail.wacc / 100) {
    notes.push("gLT clamped below WACC");
  }
  if (tvSharePct > 0.8) {
    notes.push("Warning: terminal value >80% of EV");
  }
  if (schedules.ev === 0 || Number.isNaN(schedules.ev)) {
    notes.push("Warning: EV is zero or NaN; check inputs");
  }

  return {
    series: schedules.rows,
    tv: schedules.tv,
    pvTV: schedules.pvTV,
    pvExplicit: schedules.pvExplicit,
    ev: schedules.ev,
    equity,
    price,
    tvSharePct,
    explicitSharePct,
    waccDetail,
    bridges: { evToEquity: bridge },
    notes,
  };
}

export function computeValuation(i: DcfInputs): ValuationOutput {
  const base = computeValuationBase(i);
  const bands = footballFieldBands(i, base);
  return { ...base, bands };
}

export function footballFieldBands(i: DcfInputs, base: Pick<ValuationBase, "price" | "series" | "ev" | "pvTV" | "pvExplicit">): { method: string; low: number; high: number }[] {
  const bands: { method: string; low: number; high: number }[] = [];

  if (i.gTerm !== undefined) {
    const low = computeValuationBase({ ...i, wacc: safe(i.wacc) + 1, gTerm: safe(i.gTerm) - 0.5 }).price;
    const high = computeValuationBase({ ...i, wacc: safe(i.wacc) - 1, gTerm: safe(i.gTerm) + 0.5 }).price;
    bands.push({ method: "DCF (sensibilité)", low, high });
  } else {
    bands.push({ method: "DCF (base)", low: base.price, high: base.price });
  }

  if (i.ebitdaMultipleMin !== undefined && i.ebitdaMultipleMax !== undefined) {
    const ebitda1 = base.series[0]?.ebitda ?? 0;
    const evLow = ebitda1 * i.ebitdaMultipleMin;
    const evHigh = ebitda1 * i.ebitdaMultipleMax;
    bands.push({ method: "EV/EBITDA", low: (evLow - i.netDebt) / i.sharesOut, high: (evHigh - i.netDebt) / i.sharesOut });
  }

  if (i.peMin !== undefined && i.peMax !== undefined) {
    const ni1 = base.series[0]?.nopat ?? 0; // simple NI proxy
    bands.push({ method: "P/E", low: (ni1 * i.peMin) / i.sharesOut, high: (ni1 * i.peMax) / i.sharesOut });
  }

  return bands;
}

export function sensitivityGrid(i: DcfInputs, waccVals: number[], gVals: number[]): number[][] {
  return waccVals.map((w) =>
    gVals.map((g) => {
      const out = computeValuation({ ...i, wacc: w, gTerm: g });
      return out.price;
    })
  );
}

export type TornadoInputDelta = {
  field: keyof DcfInputs;
  low: number;
  high: number;
  mode?: "abs" | "pct";
};

export type TornadoRow = {
  field: keyof DcfInputs;
  low: number;
  high: number;
  base: number;
};

function applyDelta(base: number, delta: number, mode: "abs" | "pct"): number {
  return mode === "pct" ? base * (1 + delta / 100) : base + delta;
}

// Simple tornado chart helper: vary one input at a time and capture the equity price impact.
export function tornado(inputs: DcfInputs, deltas: TornadoInputDelta[]): TornadoRow[] {
  const baseValuation = computeValuation(inputs);
  const basePrice = baseValuation.price;

  return deltas
    .filter((d): d is TornadoInputDelta => {
      const current = (inputs as any)[d.field];
      return typeof current === "number" && Number.isFinite(current);
    })
    .map((d) => {
      const mode: "abs" | "pct" = d.mode === "pct" ? "pct" : "abs";
      const current = Number((inputs as any)[d.field]);
      const lowInput = { ...inputs, [d.field]: applyDelta(current, d.low, mode) } as DcfInputs;
      const highInput = { ...inputs, [d.field]: applyDelta(current, d.high, mode) } as DcfInputs;
      const low = computeValuation(lowInput).price;
      const high = computeValuation(highInput).price;
      return { field: d.field, low, high, base: basePrice };
    });
}

// Tiny self-test for dev convenience (no framework).
if ((process.env.NODE_ENV as string) === "test_local") {
  const baseInputs: DcfInputs = {
    currency: "EUR",
    revenue0: 100_000_000,
    growth: 5,
    ebitMargin: 15,
    taxRateNorm: 25,
    capexPct: 4,
    nwcPct: 5,
    wcPolicy: "percentDeltaRevenue",
    years: 5,
    terminalMethod: "perpetuity",
    gTerm: 2,
    wacc: 9,
    netDebt: 50_000_000,
    sharesOut: 10_000_000,
  };

  const base = computeValuation(baseInputs);
  const alt = computeValuation({ ...baseInputs, wacc: 8, gTerm: 2.5 });

  // eslint-disable-next-line no-console
  if (!(base.ev > 0)) console.warn("Self-test: EV should be positive");
  // eslint-disable-next-line no-console
  if (base.tvSharePct < 0.4 || base.tvSharePct > 0.8) console.warn("Self-test: tvSharePct out of expected band", base.tvSharePct);
  // eslint-disable-next-line no-console
  if (!(alt.price > base.price)) console.warn("Self-test: price should increase when WACC down 1pt and gLT up 0.5pt");
}
