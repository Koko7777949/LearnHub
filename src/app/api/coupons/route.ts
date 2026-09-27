import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Shared coupon validity checker (used by validate + checkout routes too). */
export function couponIssue(coupon: {
  active: boolean;
  expiresAt: Date | null;
  usedCount: number;
  maxUses: number;
}): "INACTIVE" | "EXPIRED" | "MAX_USES" | null {
  if (!coupon.active) return "INACTIVE";
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return "EXPIRED";
  if (coupon.usedCount >= coupon.maxUses) return "MAX_USES";
  return null;
}

/** GET /api/coupons — list coupons. Admin sees all, instructors see their own. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const creatorId = sp.get("creatorId");
  const role = sp.get("role");

  if (role !== "ADMIN" && !creatorId) {
    return NextResponse.json({ error: "MISSING_SCOPE" }, { status: 400 });
  }

  const coupons = await db.coupon.findMany({
    where: role === "ADMIN" ? undefined : { createdBy: creatorId! },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, avatarColor: true } },
      course: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ coupons });
}

/** POST /api/coupons — create a coupon. Admin: storewide or any course. Instructor: own courses only. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, percentOff, description, courseId, maxUses, expiresAt, createdBy } = body ?? {};

    if (!createdBy) return NextResponse.json({ error: "MISSING_CREATOR" }, { status: 400 });

    const creator = await db.user.findUnique({ where: { id: createdBy } });
    if (!creator) return NextResponse.json({ error: "CREATOR_NOT_FOUND" }, { status: 404 });
    if (creator.role !== "ADMIN" && creator.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const cleanCode = String(code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(cleanCode)) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) return NextResponse.json({ error: "CODE_TAKEN" }, { status: 409 });

    const off = Math.round(Number(percentOff));
    if (!Number.isFinite(off) || off < 5 || off > 100) {
      return NextResponse.json({ error: "INVALID_PERCENT" }, { status: 400 });
    }

    const uses = Math.round(Number(maxUses));
    if (!Number.isFinite(uses) || uses < 1 || uses > 100000) {
      return NextResponse.json({ error: "INVALID_USES" }, { status: 400 });
    }

    let finalCourseId: string | null = null;
    if (courseId && courseId !== "ALL") {
      const course = await db.course.findUnique({ where: { id: courseId } });
      if (!course) return NextResponse.json({ error: "COURSE_NOT_FOUND" }, { status: 404 });
      if (creator.role === "INSTRUCTOR" && course.instructorId !== creator.id) {
        return NextResponse.json({ error: "NOT_YOUR_COURSE" }, { status: 403 });
      }
      finalCourseId = course.id;
    } else if (creator.role === "INSTRUCTOR") {
      // instructors must scope coupons to one of their own courses
      return NextResponse.json({ error: "COURSE_REQUIRED" }, { status: 400 });
    }

    let expiry: Date | null = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "INVALID_DATE" }, { status: 400 });
      expiry = d;
    }

    const coupon = await db.coupon.create({
      data: {
        code: cleanCode,
        percentOff: off,
        description: description ? String(description).trim().slice(0, 300) : null,
        courseId: finalCourseId,
        createdBy: creator.id,
        maxUses: uses,
        active: true,
        expiresAt: expiry,
      },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
