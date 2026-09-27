import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/coupons/[id] — activate/deactivate a coupon (creator or admin only). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { active, requesterId } = await req.json();

    if (typeof active !== "boolean" || !requesterId) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const requester = await db.user.findUnique({ where: { id: requesterId } });
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const allowed =
      requester?.role === "ADMIN" || (requester?.role === "INSTRUCTOR" && coupon.createdBy === requester.id);
    if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const updated = await db.coupon.update({
      where: { id },
      data: { active },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ coupon: updated });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
