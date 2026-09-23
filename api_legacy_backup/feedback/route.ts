import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("feedback GET", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { name?: string; email?: string; message?: string };
    const name = String(b.name ?? "").trim();
    const email = String(b.email ?? "").trim();
    const message = String(b.message ?? "").trim();
    if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "name, a valid email and a message are required" }, { status: 400 });
    }
    const rows = await db
      .insert(feedback)
      .values({ name: name.slice(0, 120), email: email.slice(0, 200), message: message.slice(0, 4000) })
      .returning();
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("feedback POST", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as { id?: string; status?: string };
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const status = ["new", "read", "archived"].includes(String(b.status)) ? String(b.status) : "read";
    await db.update(feedback).set({ status }).where(eq(feedback.id, b.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback PATCH", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.delete(feedback).where(eq(feedback.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback DELETE", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
