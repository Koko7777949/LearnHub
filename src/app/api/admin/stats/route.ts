import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [txs, users, courses, enrollments, pendingPayouts] = await Promise.all([
    db.transaction.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        course: { select: { title: true, category: true } },
        instructor: { select: { name: true, avatarColor: true } },
        student: { select: { name: true, avatarColor: true } },
      },
    }),
    db.user.count(),
    db.course.count(),
    db.enrollment.count(),
    db.payout.count({ where: { status: "PENDING" } }),
  ]);

  const round2 = (n: number) => Math.round(n * 100) / 100;
  let gmv = 0;
  let platformRevenue = 0;
  let instructorEarnings = 0;
  const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000;
  let gmvLast30 = 0;

  const monthlyMap = new Map<string, { net: number; gross: number; fee: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { net: 0, gross: 0, fee: 0 });
  }

  const categoryMap = new Map<string, number>();
  for (const tx of txs) {
    if (tx.type === "SALE") {
      gmv += tx.grossAmount;
      platformRevenue += tx.platformFee;
      instructorEarnings += tx.netEarnings;
      categoryMap.set(tx.course.category, (categoryMap.get(tx.course.category) || 0) + tx.grossAmount);
      if (tx.createdAt.getTime() >= cutoff30) gmvLast30 += tx.grossAmount;
    } else {
      gmv += tx.grossAmount; // negative
      platformRevenue += tx.platformFee;
      instructorEarnings += tx.netEarnings;
    }
    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(key);
    if (bucket) {
      bucket.gross += tx.grossAmount;
      bucket.fee += tx.platformFee;
      bucket.net += tx.netEarnings;
    }
  }

  const monthly = Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month,
    net: round2(v.net),
    gross: round2(v.gross),
    fee: round2(v.fee),
  }));

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, gross]) => ({ category, gross: round2(gross) }))
    .sort((a, b) => b.gross - a.gross);

  const recentTransactions = txs
    .slice(-12)
    .reverse()
    .map((tx) => ({
      id: tx.id,
      type: tx.type,
      grossAmount: tx.grossAmount,
      platformFee: tx.platformFee,
      netEarnings: tx.netEarnings,
      createdAt: tx.createdAt.toISOString(),
      course: { title: tx.course.title },
      instructor: { name: tx.instructor.name, avatarColor: tx.instructor.avatarColor },
      student: { name: tx.student.name, avatarColor: tx.student.avatarColor },
    }));

  return NextResponse.json({
    gmv: round2(gmv),
    platformRevenue: round2(platformRevenue),
    instructorEarnings: round2(instructorEarnings),
    userCount: users,
    courseCount: courses,
    enrollmentCount: enrollments,
    pendingPayoutCount: pendingPayouts,
    gmvLast30: round2(gmvLast30),
    byCategory,
    monthly,
    recentTransactions,
  });
}
