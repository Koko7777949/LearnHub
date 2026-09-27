import { db } from "@/lib/db";

export const PLATFORM_FEE_RATE = 0.3;

export function splitRevenue(gross: number) {
  const platformFee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
  const netEarnings = Math.round((gross - platformFee) * 100) / 100;
  return { platformFee, netEarnings };
}

/** Compute full ledger summary for an instructor */
export async function computeLedger(instructorId: string) {
  const [txs, payouts] = await Promise.all([
    db.transaction.findMany({
      where: { instructorId },
      orderBy: { createdAt: "asc" },
      include: {
        course: { select: { id: true, title: true, coverGradient: true } },
        student: { select: { id: true, name: true, avatarColor: true, country: true } },
      },
    }),
    db.payout.findMany({ where: { instructorId }, orderBy: { requestedAt: "desc" } }),
  ]);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  let lifetimeNet = 0;
  let grossSales = 0;
  let totalRefunds = 0;
  let platformFees = 0;
  let salesCount = 0;
  let netLast30 = 0;
  const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000;

  // monthly buckets: last 6 whole months + current
  const monthlyMap = new Map<string, { net: number; gross: number; fee: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { net: 0, gross: 0, fee: 0 });
  }

  // per-course aggregation
  const courseMap = new Map<
    string,
    { courseId: string; title: string; coverGradient: string; sales: number; refunds: number; gross: number; net: number }
  >();

  for (const tx of txs) {
    const net = tx.netEarnings; // refunds are already negative
    lifetimeNet += net;
    if (tx.type === "SALE") {
      grossSales += tx.grossAmount;
      platformFees += tx.platformFee;
      salesCount += 1;
    } else {
      totalRefunds += Math.abs(tx.grossAmount);
      platformFees += tx.platformFee; // negative
    }
    if (tx.createdAt.getTime() >= cutoff30) netLast30 += net;

    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(key);
    if (bucket) {
      bucket.net += net;
      bucket.gross += tx.grossAmount;
      bucket.fee += tx.platformFee;
    }

    const c = tx.course;
    if (!courseMap.has(c.id)) {
      courseMap.set(c.id, {
        courseId: c.id,
        title: c.title,
        coverGradient: c.coverGradient,
        sales: 0,
        refunds: 0,
        gross: 0,
        net: 0,
      });
    }
    const cb = courseMap.get(c.id)!;
    if (tx.type === "SALE") cb.sales += 1;
    else cb.refunds += 1;
    cb.gross += tx.grossAmount;
    cb.net += net;
  }

  const reserved = payouts
    .filter((p) => ["PENDING", "APPROVED", "PAID"].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const availableBalance = Math.round((lifetimeNet - reserved) * 100) / 100;
  const pendingPayouts = payouts
    .filter((p) => ["PENDING", "APPROVED"].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthly = Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month,
    net: round2(v.net),
    gross: round2(v.gross),
    fee: round2(v.fee),
  }));

  const byCourse = Array.from(courseMap.values())
    .map((c) => ({ ...c, gross: round2(c.gross), net: round2(c.net) }))
    .sort((a, b) => b.net - a.net);

  return {
    lifetimeNet: round2(lifetimeNet),
    availableBalance,
    pendingPayouts: round2(pendingPayouts),
    grossSales: round2(grossSales),
    totalRefunds: round2(totalRefunds),
    platformFees: round2(platformFees),
    salesCount,
    netLast30: round2(netLast30),
    monthly,
    byCourse,
    payouts,
  };
}
