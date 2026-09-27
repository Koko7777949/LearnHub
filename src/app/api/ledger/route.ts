import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeLedger } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const instructorId = req.nextUrl.searchParams.get("instructorId");
  if (!instructorId) return NextResponse.json({ error: "MISSING_INSTRUCTOR" }, { status: 400 });

  const instructor = await db.user.findUnique({ where: { id: instructorId } });
  if (!instructor) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const summary = await computeLedger(instructorId);

  const transactions = await db.transaction.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      course: { select: { id: true, title: true, coverGradient: true } },
      student: { select: { id: true, name: true, avatarColor: true, country: true } },
    },
  });

  return NextResponse.json({ summary, transactions, instructor: { id: instructor.id, name: instructor.name } });
}
