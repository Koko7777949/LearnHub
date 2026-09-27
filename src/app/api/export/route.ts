import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const instructorId = req.nextUrl.searchParams.get("instructorId");
  if (!instructorId) return NextResponse.json({ error: "MISSING_INSTRUCTOR" }, { status: 400 });

  const instructor = await db.user.findUnique({ where: { id: instructorId } });
  if (!instructor) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [txs, payouts] = await Promise.all([
    db.transaction.findMany({
      where: { instructorId },
      orderBy: { createdAt: "asc" },
      include: {
        course: { select: { title: true } },
        student: { select: { name: true, email: true, country: true } },
      },
    }),
    db.payout.findMany({ where: { instructorId }, orderBy: { requestedAt: "asc" } }),
  ]);

  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const money = (n: number) => n.toFixed(2);

  const rows: string[] = [];
  rows.push(
    [
      "Date",
      "Type",
      "Course",
      "Student",
      "Student Country",
      "Gross (USD)",
      "Platform Fee 30% (USD)",
      "Net Earnings 70% (USD)",
      "Status",
      "Description",
    ].join(","),
  );

  // merge transactions and payouts into a single chronological ledger
  type Entry = { date: Date; line: string[]; sortKey: number };
  const entries: Entry[] = [];

  for (const tx of txs) {
    entries.push({
      date: tx.createdAt,
      sortKey: tx.createdAt.getTime() * 10 + (tx.type === "REFUND" ? 1 : 0),
      line: [
        tx.createdAt.toISOString().slice(0, 10),
        tx.type,
        tx.course.title,
        tx.student.name,
        tx.student.country || "",
        money(tx.grossAmount),
        money(tx.platformFee),
        money(tx.netEarnings),
        tx.status,
        tx.type === "REFUND" ? tx.refundReason || "Refund" : tx.description || "",
      ],
    });
  }
  for (const p of payouts) {
    entries.push({
      date: p.requestedAt,
      sortKey: p.requestedAt.getTime() * 10 + 2,
      line: [
        p.requestedAt.toISOString().slice(0, 10),
        "PAYOUT",
        "—",
        "—",
        "—",
        money(-p.amount),
        money(0),
        money(-p.amount),
        p.status,
        `${p.method} payout`,
      ],
    });
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  for (const e of entries) rows.push(e.line.map(esc).join(","));

  // summary footer
  const totalNet = txs.reduce((s, t) => s + t.netEarnings, 0);
  const paidOut = payouts
    .filter((p) => ["PENDING", "APPROVED", "PAID"].includes(p.status))
    .reduce((s, p) => s + p.amount, 0);
  rows.push("");
  rows.push(`Summary,,,,,,,,"Lifetime Net: ${money(totalNet)}","Paid/Reserved: ${money(paidOut)}","Available: ${money(totalNet - paidOut)}"`);

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revenue-ledger-${instructor.name.toLowerCase().replace(/\s+/g, "-")}.csv"`,
    },
  });
}
