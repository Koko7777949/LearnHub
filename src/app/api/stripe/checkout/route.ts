import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { priceCart, enrollPriced } from "@/lib/enroll";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/checkout
 * Body: { studentId, courseIds: string[], couponCode?: string }
 *
 * Real Stripe Checkout session creation:
 *  1. Prices the cart server-side with the shared engine (coupon scoping included)
 *  2. Creates a Stripe Checkout Session — one line item per course at its
 *     discounted unit price, 70/30 ledger split recorded at fulfillment time
 *  3. Returns { url } — the client redirects the browser to Stripe's hosted page
 *
 * Edge case: a 100%-off coupon makes the total $0 — Stripe won't accept a $0
 * session, so we enroll directly and return { free: true }.
 * If STRIPE_SECRET_KEY is absent, responds { enabled: false } and the client
 * transparently falls back to the demo checkout rail.
 */
export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ enabled: false }, { status: 200 });
    }

    const body = await req.json();
    const priced = await priceCart(body);
    if (!priced.ok) {
      const status =
        priced.error === "STUDENT_NOT_FOUND" ? 404 : priced.error === "NOT_A_STUDENT" ? 403 : 400;
      return NextResponse.json({ error: priced.error }, { status });
    }

    const { student, priced: items, coupon, totals } = priced.data;

    // 100% discount → nothing to charge → enroll immediately
    if (!items.length || totals.total <= 0) {
      const result = items.length ? await enrollPriced(priced.data) : null;
      return NextResponse.json({
        free: true,
        enrolled: result?.enrolled ?? [],
        skippedOwned: priced.data.skippedOwned,
        totals,
        coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff } : null,
      });
    }

    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
    const origin = req.nextUrl.origin;

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: student.id,
      customer_email: student.email,
      line_items: items.map((p) => ({
        quantity: 1,
        price_data: {
          currency,
          product_data: {
            name: p.course.title.slice(0, 120),
            description: `LearnHub course · lifetime access${p.discounted && coupon ? ` · coupon ${coupon.code} (-${coupon.percentOff}%)` : ""}`,
          },
          unit_amount: Math.round(p.pricePaid * 100),
        },
      })),
      metadata: {
        studentId: student.id,
        courseIds: JSON.stringify(items.map((p) => p.course.id)),
        couponCode: coupon?.code ?? "",
      },
      payment_intent_data: {
        metadata: {
          studentId: student.id,
          couponCode: coupon?.code ?? "",
        },
      },
      success_url: `${origin}/api/stripe/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id, totals });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "STRIPE_ERROR" }, { status: 500 });
  }
}
