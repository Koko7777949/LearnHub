import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/learning?courseId=...&studentId=... */
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!courseId) return NextResponse.json({ error: "MISSING_COURSE" }, { status: 400 });

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { id: true, name: true, headline: true, bio: true, avatarColor: true, country: true } },
      lessons: { orderBy: { order: "asc" } },
    },
  });
  if (!course) return NextResponse.json({ error: "COURSE_NOT_FOUND" }, { status: 404 });

  let enrollment: { enrollmentId: string; progress: number; enrolledAt: Date } | null = null;
  let completedIds = new Set<string>();
  let myReview: unknown = null;

  if (studentId) {
    const [enr, review] = await Promise.all([
      db.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        include: { lessonProgress: { select: { lessonId: true } } },
      }),
      db.review.findUnique({
        where: { courseId_studentId: { courseId, studentId } },
        include: { student: { select: { id: true, name: true, avatarColor: true, country: true } } },
      }),
    ]);
    myReview = review;
    if (enr) {
      completedIds = new Set(enr.lessonProgress.map((p) => p.lessonId));
      enrollment = {
        enrollmentId: enr.id,
        progress: enr.progress,
        enrolledAt: enr.createdAt,
      };
    }
  }

  const lessons = course.lessons.map((l) => ({
    ...l,
    completed: completedIds.has(l.id),
  }));
  const { lessons: _l, ...courseBase } = course;

  return NextResponse.json({
    course: { ...courseBase, lessons },
    lessons,
    enrollment,
    myReview,
  });
}
