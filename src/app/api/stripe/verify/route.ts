import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { priceCart, enrollPriced } from "@/lib/enroll";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/verify?session_id=cs_test_...
 *
 * Stripe redirects the buyer here after completing Checkout. We retrieve the
 * session SERVER-SIDE (never trust client claims), re-price the cart with the
 * shared engine, and fulfill atomically (enrollments + 70/30 SALE ledger rows +
 * student counts + coupon usage). Idempotency guard: we short-circuit when the
 * metadata course set is already fully enrolled, so refreshes or Stripe retries
 * never double-enroll.
 *
 * Then the browser is redirected back into the SPA:
 *   /?payment=success&count=N     → success toast + My Learning
 *   /?payment=already             → all courses were already owned
 *   /?payment=cancelled           → (handled by cancel_url)
 *   /?payment=error               → verification failed
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!sessionId || !secretKey) {
    return NextResponse.redirect(`${origin}/?payment=error`);
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      // buyer abandoned / payment incomplete → treat as cancel
      return NextResponse.redirect(`${origin}/?payment=cancelled`);
    }

    const studentId = session.metadata?.studentId || session.client_reference_id;
    let courseIds: string[] = [];
    try {
      courseIds = JSON.parse(session.metadata?.courseIds || "[]");
    } catch {
      courseIds = [];
    }
    const couponCode = session.metadata?.couponCode || undefined;

    if (!studentId || !courseIds.length) {
      return NextResponse.redirect(`${origin}/?payment=error`);
    }

    const priced = await priceCart({ studentId, courseIds, couponCode });
    if (!priced.ok) {
      return NextResponse.redirect(`${origin}/?payment=error`);
    }

    // idempotency: if everything was already enrolled (verify retry/refresh) → done
    if (!priced.data.priced.length) {
      return NextResponse.redirect(`${origin}/?payment=already&count=${priced.data.skippedOwned.length}`);
    }

    const result = await enrollPriced(priced.data);
    const count = result.enrolled.length;
    return NextResponse.redirect(`${origin}/?payment=success&count=${count}`);
  } catch (err) {
    console.error("[stripe/verify]", err);
    return NextResponse.redirect(`${origin}/?payment=error`);
  }
}
