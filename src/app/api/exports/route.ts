import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exportsLog, feedback } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(exportsLog).orderBy(desc(exportsLog.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("exports GET", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const rows = await db
      .insert(exportsLog)
      .values({
        name: String(b.name ?? "untitled").slice(0, 160),
        resolution: String(b.resolution ?? "source").slice(0, 20),
        width: typeof b.width === "number" ? Math.round(b.width) : null,
        height: typeof b.height === "number" ? Math.round(b.height) : null,
        frames: typeof b.frames === "number" ? Math.round(b.frames) : null,
        duration: typeof b.duration === "number" ? b.duration : null,
        bytes: typeof b.bytes === "number" ? Math.round(b.bytes) : null,
      })
      .returning();
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("exports POST", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.delete(exportsLog).where(eq(exportsLog.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("exports DELETE", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
