import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/reviews?courseId=... */
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "MISSING_COURSE" }, { status: 400 });

  const reviews = await db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: { student: { select: { id: true, name: true, avatarColor: true, country: true } } },
  });

  return NextResponse.json({ reviews });
}

/** POST /api/reviews { courseId, studentId, rating, comment } — upsert (must own course) */
export async function POST(req: NextRequest) {
  try {
    const { courseId, studentId, rating, comment } = await req.json();
    if (!courseId || !studentId) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

    const ratingNum = Math.round(Number(rating));
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "INVALID_RATING" }, { status: 400 });
    }
    const text = String(comment ?? "").trim();
    if (!text) return NextResponse.json({ error: "EMPTY_COMMENT" }, { status: 400 });

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) return NextResponse.json({ error: "NOT_ENROLLED" }, { status: 403 });

    const review = await db.review.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      create: { courseId, studentId, rating: ratingNum, comment: text.slice(0, 2000) },
      update: { rating: ratingNum, comment: text.slice(0, 2000) },
      include: { student: { select: { id: true, name: true, avatarColor: true, country: true } } },
    });

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
