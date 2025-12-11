import { NextRequest, NextResponse } from "next/server";
import { tornado } from "@/lib/valuation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputs, deltas } = body || {};
    if (!inputs || !Array.isArray(deltas)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const data = tornado(inputs, deltas);
    return NextResponse.json({ data });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

