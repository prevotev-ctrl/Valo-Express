"use client";
import React from "react";

type WaccProps = {
  wacc: number; // en %
  costOfEquity?: number; // en %
  costOfDebtAfterTax?: number; // en %
  betaLevered?: number;
  leverage?: number; // D/(D+E)
  premiumComponents?: {
    riskFree?: number;
    marketPremium?: number;
    countryRiskPremium?: number;
    smallCapPremium?: number;
    costOfDebtPreTax?: number;
    taxRate?: number;
  };
};

export default function WaccBreakdown({
  wacc,
  costOfEquity,
  costOfDebtAfterTax,
  betaLevered,
  leverage,
  premiumComponents = {},
}: WaccProps) {
  const toPct = (x: number | undefined) => {
    const val = x ?? 0;
    const dec = val > 1 ? val / 100 : val;
    return (dec * 100).toFixed(2) + "%";
  };
  const lev = leverage ?? 0;
  const deRatio = lev > 0 && lev < 1 ? lev / (1 - lev) : 0;

  return (
    <div className="border rounded p-4 bg-white">
      <div className="font-medium mb-2">WACC Breakdown</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Ke</div><div className="text-right">{toPct(costOfEquity)}</div>
        <div>Kd (après impôt)</div><div className="text-right">{toPct(costOfDebtAfterTax)}</div>
        <div>WACC</div><div className="text-right font-medium">{toPct(wacc)}</div>
        <div>Beta lev.</div><div className="text-right">{(betaLevered ?? 0).toFixed(2)}</div>
        <div>D/E</div><div className="text-right">{deRatio.toFixed(2)}</div>
        <div>Leverage D/(D+E)</div><div className="text-right">{(lev * 100).toFixed(0)}%</div>
      </div>
      <div className="mt-3 text-xs text-gray-600">
        rf: {toPct(premiumComponents.riskFree)} • mp: {toPct(premiumComponents.marketPremium)} • crp: {toPct(premiumComponents.countryRiskPremium)} • scp: {toPct(premiumComponents.smallCapPremium)} • kd pre: {toPct(premiumComponents.costOfDebtPreTax)} • tax: {toPct(premiumComponents.taxRate)}
      </div>
    </div>
  );
}
