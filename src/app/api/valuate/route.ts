import { NextRequest, NextResponse } from "next/server";
import { computeValuation } from "@/lib/valuation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // validations très basiques
    if (!body || typeof body.revenue0 !== "number" || typeof body.years !== "number") {
      return NextResponse.json({ error: "Inputs invalides" }, { status: 400 });
    }
    // rétro-compat : si taxRate (ancien champ) est fourni, le mapper vers taxRateNorm attendu
    const inputs = {
      ...body,
      taxRateNorm: body.taxRateNorm ?? body.taxRate,
    };
    const valuation = computeValuation(inputs);
    return NextResponse.json(valuation);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
