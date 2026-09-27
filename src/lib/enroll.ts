import { db } from "@/lib/db";
import { splitRevenue } from "@/lib/ledger";
import { couponIssue } from "@/app/api/coupons/route";

/**
 * Shared cart pricing + enrollment engine.
 *
 * Used by:
 *  - POST /api/cart/checkout        (demo checkout: instant enrollment, no payment)
 *  - POST /api/stripe/checkout      (real Stripe Checkout: builds line items from pricing)
 *  - GET  /api/stripe/verify        (post-payment fulfillment: enrolls after Stripe confirms)
 *
 * Keeping one engine guarantees the 70/30 ledger split, coupon scoping rules and
 * student-count increments behave identically no matter which payment rail ran.
 */

export interface PricedCourse {
  course: { id: string; title: string; subtitle: string; price: number; instructorId: string };
  fullPrice: number;
  pricePaid: number;
  discounted: boolean;
}

export interface CartPricing {
  student: { id: string; name: string; email: string };
  priced: PricedCourse[];
  skippedOwned: { courseId: string; title: string }[];
  coupon: { id: string; code: string; percentOff: number; courseId: string | null } | null;
  totals: { subtotal: number; discount: number; total: number };
}

export type PriceCartError =
  | "MISSING_FIELDS"
  | "STUDENT_NOT_FOUND"
  | "NOT_A_STUDENT"
  | "NO_VALID_COURSES"
  | "NOTHING_TO_BUY";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Price a cart: validate the student, drop owned courses, apply coupon scoping rules. */
export async function priceCart(input: {
  studentId: unknown;
  courseIds: unknown;
  couponCode?: unknown;
}): Promise<{ ok: true; data: CartPricing } | { ok: false; error: PriceCartError }> {
  const { studentId, courseIds, couponCode } = input;
  if (!studentId || !Array.isArray(courseIds) || !courseIds.length) {
    return { ok: false, error: "MISSING_FIELDS" };
  }

  const student = await db.user.findUnique({ where: { id: studentId as string } });
  if (!student) return { ok: false, error: "STUDENT_NOT_FOUND" };
  if (student.role !== "STUDENT") return { ok: false, error: "NOT_A_STUDENT" };

  const courses = await db.course.findMany({
    where: { id: { in: courseIds as string[] }, status: "PUBLISHED" },
  });
  if (!courses.length) return { ok: false, error: "NO_VALID_COURSES" };

  const existing = await db.enrollment.findMany({
    where: { studentId: student.id, courseId: { in: courses.map((c) => c.id) } },
    select: { courseId: true },
  });
  const ownedSet = new Set(existing.map((e) => e.courseId));
  const toBuy = courses.filter((c) => !ownedSet.has(c.id));
  const skippedOwned = courses
    .filter((c) => ownedSet.has(c.id))
    .map((c) => ({ courseId: c.id, title: c.title }));

  if (!toBuy.length) {
    return {
      ok: true,
      data: {
        student: { id: student.id, name: student.name, email: student.email },
        priced: [],
        skippedOwned,
        coupon: null,
        totals: { subtotal: 0, discount: 0, total: 0 },
      },
    };
  }

  // validate coupon (if any)
  let coupon: { id: string; code: string; percentOff: number; courseId: string | null } | null = null;
  const cleanCode = couponCode ? String(couponCode).trim().toUpperCase() : "";
  if (cleanCode) {
    const found = await db.coupon.findUnique({ where: { code: cleanCode } });
    const issue = found ? couponIssue(found) : "NOT_FOUND";
    if (found && !issue) {
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

  const priced: PricedCourse[] = toBuy.map((c) => {
    const applies = coupon ? !coupon.courseId || coupon.courseId === c.id : false;
    const pricePaid = applies ? round2(c.price * (1 - coupon!.percentOff / 100)) : c.price;
    return {
      course: { id: c.id, title: c.title, subtitle: c.subtitle, price: c.price, instructorId: c.instructorId },
      fullPrice: c.price,
      pricePaid,
      discounted: applies,
    };
  });

  const subtotal = round2(priced.reduce((s, p) => s + p.fullPrice, 0));
  const total = round2(priced.reduce((s, p) => s + p.pricePaid, 0));

  return {
    ok: true,
    data: {
      student: { id: student.id, name: student.name, email: student.email },
      priced,
      skippedOwned,
      coupon,
      totals: { subtotal, discount: round2(subtotal - total), total },
    },
  };
}

export interface EnrollResult {
  enrolled: { courseId: string; title: string; fullPrice: number; pricePaid: number }[];
  skippedOwned: { courseId: string; title: string }[];
  totals: { subtotal: number; discount: number; total: number };
  coupon: { code: string; percentOff: number } | null;
}

/** Atomically enroll a priced cart: enrollments + SALE transactions (70/30 split) + counters. */
export async function enrollPriced(pricing: CartPricing): Promise<EnrollResult> {
  const { student, priced, skippedOwned, coupon } = pricing;
  const ops: unknown[] = [];
  const enrolled: EnrollResult["enrolled"] = [];

  for (const p of priced) {
    const { platformFee, netEarnings } = splitRevenue(p.pricePaid);
    const description = p.discounted
      ? `Course purchase · coupon ${coupon!.code} (-${coupon!.percentOff}%)`
      : "Course purchase";

    ops.push(
      db.enrollment.create({
        data: { studentId: student.id, courseId: p.course.id, pricePaid: p.pricePaid, progress: 0 },
      }),
      db.transaction.create({
        data: {
          type: "SALE",
          courseId: p.course.id,
          studentId: student.id,
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

    enrolled.push({
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

  if (ops.length) await db.$transaction(ops as never);

  return {
    enrolled,
    skippedOwned,
    totals: pricing.totals,
    coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff } : null,
  };
}
