import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED = ["PENDING", "APPROVED", "PAID", "REJECTED"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { status, note } = await req.json();
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });

    const payout = await db.payout.findUnique({ where: { id } });
    if (!payout) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    // guard: only pending -> approved/rejected, approved -> paid
    const legal =
      (payout.status === "PENDING" && ["APPROVED", "REJECTED"].includes(status)) ||
      (payout.status === "APPROVED" && status === "PAID");
    if (!legal) return NextResponse.json({ error: "ILLEGAL_TRANSITION" }, { status: 400 });

    const updated = await db.payout.update({
      where: { id },
      data: {
        status,
        note: note ?? payout.note,
        processedAt: ["APPROVED", "REJECTED", "PAID"].includes(status) ? new Date() : null,
      },
    });
    return NextResponse.json({ payout: updated });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
