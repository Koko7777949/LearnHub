import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeLedger } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const instructorId = sp.get("instructorId");
  const status = sp.get("status");

  const where: Record<string, unknown> = {};
  if (instructorId) where.instructorId = instructorId;
  if (status && status !== "ALL") where.status = status;

  const payouts = await db.payout.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: { instructor: { select: { id: true, name: true, email: true, avatarColor: true } } },
  });
  return NextResponse.json({ payouts });
}

export async function POST(req: NextRequest) {
  try {
    const { instructorId, amount, method } = await req.json();
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!instructorId || !amt || amt <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const summary = await computeLedger(instructorId);
    if (amt > summary.availableBalance) {
      return NextResponse.json(
        { error: "INSUFFICIENT_BALANCE", available: summary.availableBalance },
        { status: 400 },
      );
    }

    const payout = await db.payout.create({
      data: {
        instructorId,
        amount: amt,
        method: method || "PAYPAL",
        status: "PENDING",
      },
    });
    return NextResponse.json({ payout });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
