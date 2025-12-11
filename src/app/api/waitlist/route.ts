import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE).catch(async () => {
      await fs.writeFile(DATA_FILE, "[]", "utf8");
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    await ensureFile();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const list = JSON.parse(raw) as Array<{ name?: string; email: string; ts: string }>;
    const entry = { name: name || "", email, ts: new Date().toISOString() };
    list.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureFile();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const list = JSON.parse(raw) as Array<{ email: string }>;
    return NextResponse.json({ count: list.length });
  } catch (e: any) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
