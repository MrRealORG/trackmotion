import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(assets).orderBy(asc(assets.createdAt));
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.kind,
        dataUrl: r.dataUrl,
        uploadedAt: r.createdAt.getTime(),
      })),
    );
  } catch (err) {
    console.error("assets GET", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      items?: { id?: string; name: string; type: string; dataUrl: string }[];
    };
    const items = body.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }
    const clean = items
      .filter((i) => typeof i?.dataUrl === "string" && typeof i?.name === "string")
      .slice(0, 24)
      .map((i) => ({
        name: i.name.slice(0, 120),
        kind: ["sticker", "preview", "background"].includes(i.type) ? i.type : "sticker",
        dataUrl: i.dataUrl,
      }));
    const rows = await db.insert(assets).values(clean).returning();
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("assets POST", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.delete(assets).where(eq(assets.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("assets DELETE", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
