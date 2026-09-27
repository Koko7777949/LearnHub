import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/config
 * Tells the client whether real Stripe Checkout is active on this deployment.
 * Active ⇔ STRIPE_SECRET_KEY is present in the environment (Vercel project env
 * vars or local .env). When inactive, the cart falls back to the demo rail.
 */
export async function GET() {
  const enabled = !!process.env.STRIPE_SECRET_KEY;
  return NextResponse.json({
    enabled,
    mode: process.env.STRIPE_MODE === "live" ? "live" : "test",
    currency: process.env.STRIPE_CURRENCY || "usd",
  });
}
