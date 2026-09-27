import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/wishlist?studentId=... */
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "MISSING_STUDENT" }, { status: 400 });

  const items = await db.wishlist.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: { instructor: { select: { id: true, name: true, headline: true, avatarColor: true, country: true } } },
      },
    },
  });

  return NextResponse.json({
    wishlist: items.map((w) => ({
      courseId: w.courseId,
      createdAt: w.createdAt,
      course: w.course,
    })),
  });
}

/** POST /api/wishlist { studentId, courseId } — toggle */
export async function POST(req: NextRequest) {
  try {
    const { studentId, courseId } = await req.json();
    if (!studentId || !courseId) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

    const existing = await db.wishlist.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    }

    await db.wishlist.create({ data: { studentId, courseId } });
    return NextResponse.json({ wishlisted: true });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
