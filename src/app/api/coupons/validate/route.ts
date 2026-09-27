import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { couponIssue } from "../route";

/**
 * POST /api/coupons/validate
 * Body: { code, courseIds: string[] }
 * Returns validity + per-course discount amounts for the current cart.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, courseIds } = await req.json();
    const cleanCode = String(code ?? "").trim().toUpperCase();
    const ids: string[] = Array.isArray(courseIds) ? courseIds.filter((c: unknown) => typeof c === "string") : [];

    if (!cleanCode) return NextResponse.json({ valid: false, reason: "NOT_FOUND" }, { status: 200 });

    const coupon = await db.coupon.findUnique({
      where: { code: cleanCode },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!coupon) return NextResponse.json({ valid: false, reason: "NOT_FOUND" }, { status: 200 });

    const issue = couponIssue(coupon);
    if (issue) return NextResponse.json({ valid: false, reason: issue }, { status: 200 });

    if (!ids.length) return NextResponse.json({ valid: false, reason: "NOT_APPLICABLE" }, { status: 200 });

    const courses = await db.course.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      select: { id: true, price: true },
    });

    const items = courses.map((c) => {
      const applies = !coupon.courseId || coupon.courseId === c.id;
      const discountAmount = applies ? Math.round(c.price * (coupon.percentOff / 100) * 100) / 100 : 0;
      return { courseId: c.id, originalPrice: c.price, discountAmount };
    });

    const totalDiscount = Math.round(items.reduce((s, i) => s + i.discountAmount, 0) * 100) / 100;
    if (totalDiscount <= 0) return NextResponse.json({ valid: false, reason: "NOT_APPLICABLE" }, { status: 200 });

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        percentOff: coupon.percentOff,
        description: coupon.description,
        scopeCourseTitle: coupon.course?.title ?? null,
      },
      items,
      totalDiscount,
    });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
