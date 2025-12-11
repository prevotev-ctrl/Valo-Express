export type DisplayUnit = "k" | "M" | "B";

export function unitMultiplier(u: DisplayUnit) {
  if (u === "k") return 1e3;
  if (u === "M") return 1e6;
  return 1e9;
}

export function formatAmount(n: number, unit: DisplayUnit, currency?: string) {
  const mult = unitMultiplier(unit);
  const nf = new Intl.NumberFormat("fr-FR", currency ? { style: "currency", currency } : undefined);
  return nf.format(n / mult);
}

