import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(projects).orderBy(asc(projects.createdAt));
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        videoName: r.videoName,
        duration: r.duration,
        createdAt: r.createdAt.getTime(),
        data: r.data,
      })),
    );
  } catch (err) {
    console.error("projects GET", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      videoName?: string;
      duration?: number;
      data?: Record<string, unknown>;
    };
    if (!body?.name || !body?.data) {
      return NextResponse.json({ error: "name and data required" }, { status: 400 });
    }
    const rows = await db
      .insert(projects)
      .values({
        name: String(body.name).slice(0, 120),
        videoName: String(body.videoName ?? "clip").slice(0, 200),
        duration: typeof body.duration === "number" ? body.duration : null,
        data: body.data,
      })
      .returning();
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("projects POST", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("projects DELETE", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
