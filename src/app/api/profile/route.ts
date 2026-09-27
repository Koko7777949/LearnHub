import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/profile?userId=... — public profile + stats + achievements data */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "MISSING_USER" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const [enrollmentCount, completedCount, reviewCount, wishlistCount, courseCount, txAgg, spentAgg] =
    await Promise.all([
      db.enrollment.count({ where: { studentId: userId } }),
      db.enrollment.count({ where: { studentId: userId, progress: { gte: 100 } } }),
      db.review.count({ where: { studentId: userId } }),
      db.wishlist.count({ where: { studentId: userId } }),
      db.course.count({ where: { instructorId: userId } }),
      db.transaction.aggregate({
        where: { instructorId: userId, type: "SALE" },
        _sum: { netEarnings: true },
      }),
      db.transaction.aggregate({
        where: { studentId: userId, type: "SALE" },
        _sum: { grossAmount: true },
      }),
    ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      headline: user.headline,
      bio: user.bio,
      country: user.country,
      createdAt: user.createdAt,
    },
    stats: {
      enrollmentCount,
      completedCount,
      reviewCount,
      wishlistCount,
      courseCount,
      lifetimeNet: Math.round((txAgg._sum.netEarnings || 0) * 100) / 100,
      totalSpent: Math.round((spentAgg._sum.grossAmount || 0) * 100) / 100,
    },
  });
}

/** PATCH /api/profile { userId, name?, headline?, bio?, country? } */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, name, headline, bio, country } = await req.json();
    if (!userId) return NextResponse.json({ error: "MISSING_USER" }, { status: 400 });

    const data: Record<string, string> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 100);
    if (typeof headline === "string") data.headline = headline.trim().slice(0, 160) || "";
    if (typeof bio === "string") data.bio = bio.trim().slice(0, 1000);
    if (typeof country === "string") data.country = country.trim().slice(0, 80);
    if (!Object.keys(data).length) return NextResponse.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });

    const user = await db.user.update({ where: { id: userId }, data });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarColor: user.avatarColor,
        headline: user.headline,
        bio: user.bio,
        country: user.country,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
