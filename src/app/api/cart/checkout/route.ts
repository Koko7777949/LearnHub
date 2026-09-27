import { NextRequest, NextResponse } from "next/server";
import { priceCart, enrollPriced } from "@/lib/enroll";

/**
 * POST /api/cart/checkout
 * Body: { studentId, courseIds: string[], couponCode?: string }
 *
 * Demo rail: instantly bulk-enrolls the student into every cart course, applies a
 * valid coupon where applicable (storewide or course-scoped), records SALE
 * transactions with the 70/30 split on the *discounted* price, and increments
 * course student counts + coupon usage.
 *
 * When STRIPE_SECRET_KEY is configured, the client uses /api/stripe/checkout
 * instead — both rails share the exact same pricing/fulfillment engine.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const priced = await priceCart(body);
    if (!priced.ok) {
      const status =
        priced.error === "STUDENT_NOT_FOUND" ? 404 : priced.error === "NOT_A_STUDENT" ? 403 : 400;
      return NextResponse.json({ error: priced.error }, { status });
    }

    const result = await enrollPriced(priced.data);

    return NextResponse.json({
      enrolled: result.enrolled,
      skippedOwned: result.skippedOwned,
      totals: result.totals,
      coupon: result.coupon,
    });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
