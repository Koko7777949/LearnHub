import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { splitRevenue } from "@/lib/ledger";
import { couponIssue } from "../../coupons/route";

/**
 * POST /api/cart/checkout
 * Body: { studentId, courseIds: string[], couponCode?: string }
 *
 * Bulk-enrolls the student into every cart course in one transaction, applies
 * a valid coupon where applicable (storewide or course-scoped), records SALE
 * transactions with the 70/30 split on the *discounted* price, and increments
 * course student counts + coupon usage.
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId, courseIds, couponCode } = await req.json();
    if (!studentId || !Array.isArray(courseIds) || !courseIds.length) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const student = await db.user.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "STUDENT_NOT_FOUND" }, { status: 404 });
    if (student.role !== "STUDENT") {
      return NextResponse.json({ error: "NOT_A_STUDENT" }, { status: 403 });
    }

    // resolve courses (published only)
    const courses = await db.course.findMany({
      where: { id: { in: courseIds }, status: "PUBLISHED" },
    });
    if (!courses.length) return NextResponse.json({ error: "NO_VALID_COURSES" }, { status: 400 });

    // existing enrollments → skip
    const existing = await db.enrollment.findMany({
      where: { studentId, courseId: { in: courses.map((c) => c.id) } },
      select: { courseId: true },
    });
    const ownedSet = new Set(existing.map((e) => e.courseId));
    const toBuy = courses.filter((c) => !ownedSet.has(c.id));
    const skippedOwned = courses
      .filter((c) => ownedSet.has(c.id))
      .map((c) => ({ courseId: c.id, title: c.title }));

    if (!toBuy.length) {
      return NextResponse.json({
        enrolled: [],
        skippedOwned,
        totals: { subtotal: 0, discount: 0, total: 0 },
        coupon: null,
      });
    }

    // validate coupon (if any)
    let coupon: { id: string; code: string; percentOff: number; courseId: string | null } | null = null;
    const cleanCode = couponCode ? String(couponCode).trim().toUpperCase() : "";
    if (cleanCode) {
      const found = await db.coupon.findUnique({ where: { code: cleanCode } });
      const issue = found ? couponIssue(found) : "NOT_FOUND";
      if (found && !issue) {
        // storewide coupons always apply; course coupons only if that course is in the cart
        const applies = !found.courseId || toBuy.some((c) => c.id === found.courseId);
        if (applies) {
          coupon = {
            id: found.id,
            code: found.code,
            percentOff: found.percentOff,
            courseId: found.courseId,
          };
        }
      }
    }

    // price each course (discount only where the coupon applies)
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const priced = toBuy.map((c) => {
      const applies = coupon ? !coupon.courseId || coupon.courseId === c.id : false;
      const pricePaid = applies ? round2(c.price * (1 - coupon!.percentOff / 100)) : c.price;
      return { course: c, fullPrice: c.price, pricePaid, discounted: applies };
    });

    const subtotal = round2(priced.reduce((s, p) => s + p.fullPrice, 0));
    const total = round2(priced.reduce((s, p) => s + p.pricePaid, 0));
    const discount = round2(subtotal - total);

    // build the atomic transaction
    const ops: unknown[] = [];
    const enrolledResult: { courseId: string; title: string; fullPrice: number; pricePaid: number }[] = [];

    for (const p of priced) {
      const { platformFee, netEarnings } = splitRevenue(p.pricePaid);
      const description = p.discounted
        ? `Course purchase · coupon ${coupon!.code} (-${coupon!.percentOff}%)`
        : "Course purchase";

      ops.push(
        db.enrollment.create({
          data: { studentId, courseId: p.course.id, pricePaid: p.pricePaid, progress: 0 },
        }),
        db.transaction.create({
          data: {
            type: "SALE",
            courseId: p.course.id,
            studentId,
            instructorId: p.course.instructorId,
            grossAmount: p.pricePaid,
            platformFee,
            netEarnings,
            status: "COMPLETED",
            description,
          },
        }),
        db.course.update({
          where: { id: p.course.id },
          data: { studentsCount: { increment: 1 } },
        }),
      );

      enrolledResult.push({
        courseId: p.course.id,
        title: p.course.title,
        fullPrice: p.fullPrice,
        pricePaid: p.pricePaid,
      });
    }

    if (coupon) {
      ops.push(
        db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        }),
      );
    }

    await db.$transaction(ops as never);

    return NextResponse.json({
      enrolled: enrolledResult,
      skippedOwned,
      totals: { subtotal, discount, total },
      coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff } : null,
    });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
