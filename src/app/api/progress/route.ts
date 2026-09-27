import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** POST /api/progress { enrollmentId, lessonId, completed } */
export async function POST(req: NextRequest) {
  try {
    const { enrollmentId, lessonId, completed } = await req.json();
    if (!enrollmentId || !lessonId || typeof completed !== "boolean") {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { select: { id: true, lessonsCount: true } } },
    });
    if (!enrollment) return NextResponse.json({ error: "ENROLLMENT_NOT_FOUND" }, { status: 404 });

    // verify the lesson belongs to the enrolled course
    const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || lesson.courseId !== enrollment.courseId) {
      return NextResponse.json({ error: "LESSON_NOT_IN_COURSE" }, { status: 400 });
    }

    if (completed) {
      await db.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
        create: { enrollmentId, lessonId },
        update: {},
      });
    } else {
      await db.lessonProgress.deleteMany({ where: { enrollmentId, lessonId } });
    }

    // recompute enrollment progress from lesson completion
    const [progressCount, lessonsCount] = await Promise.all([
      db.lessonProgress.count({ where: { enrollmentId } }),
      db.lesson.count({ where: { courseId: enrollment.courseId } }),
    ]);
    const progress = lessonsCount ? Math.round((progressCount / lessonsCount) * 100) : 0;
    await db.enrollment.update({ where: { id: enrollmentId }, data: { progress } });

    return NextResponse.json({ progress, completedCount: progressCount, lessonsTotal: lessonsCount });
  } catch (err) {
    console.error("[api/progress] error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
