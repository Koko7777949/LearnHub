import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { splitRevenue } from "@/lib/ledger";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "MISSING_STUDENT" }, { status: 400 });

  const [enrollments, purchases] = await Promise.all([
    db.enrollment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, headline: true, avatarColor: true, country: true } },
          },
        },
      },
    }),
    db.transaction.findMany({
      where: { studentId, type: "SALE" },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { id: true, title: true, coverGradient: true } } },
    }),
  ]);

  return NextResponse.json({ enrollments, purchases });
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, courseId } = await req.json();
    if (!studentId || !courseId) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) return NextResponse.json({ error: "COURSE_NOT_FOUND" }, { status: 404 });

    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) return NextResponse.json({ error: "ALREADY_ENROLLED" }, { status: 409 });

    const student = await db.user.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "STUDENT_NOT_FOUND" }, { status: 404 });

    const { platformFee, netEarnings } = splitRevenue(course.price);

    const [enrollment, tx] = await db.$transaction([
      db.enrollment.create({
        data: { studentId, courseId, pricePaid: course.price, progress: 0 },
      }),
      db.transaction.create({
        data: {
          type: "SALE",
          courseId,
          studentId,
          instructorId: course.instructorId,
          grossAmount: course.price,
          platformFee,
          netEarnings,
          status: "COMPLETED",
          description: "Course purchase",
        },
      }),
      db.course.update({
        where: { id: courseId },
        data: { studentsCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ enrollment, transaction: tx });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
