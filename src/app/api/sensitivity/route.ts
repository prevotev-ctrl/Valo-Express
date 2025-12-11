import { NextRequest, NextResponse } from "next/server";
import { sensitivityGrid } from "@/lib/valuation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputs, waccVals, gVals } = body || {};
    if (!inputs || !Array.isArray(waccVals) || !Array.isArray(gVals)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const grid = sensitivityGrid(inputs, waccVals, gVals);
    return NextResponse.json({ grid, waccVals, gVals });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

