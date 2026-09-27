import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const CATEGORIES = ["Development", "Business", "Design", "Data Science", "Marketing", "IT & Software"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/** Accept https:// video links (MP4/WebM/YouTube) or locally uploaded /api/videos/<file> URLs. */
function sanitizeVideoUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const url = input.trim().slice(0, 500);
  if (!url) return null;
  if (/^https:\/\//i.test(url)) return url; // external MP4/WebM/YouTube/Vimeo
  if (/^\/api\/videos\/[a-f0-9-]+\.(mp4|webm|mov)$/i.test(url)) return url; // uploaded file
  return null;
}
const GRADIENTS = [
  "from-indigo-500 via-violet-500 to-purple-600",
  "from-teal-400 via-cyan-500 to-sky-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-emerald-400 via-green-500 to-teal-600",
  "from-slate-700 via-slate-800 to-indigo-900",
  "from-blue-600 via-indigo-600 to-violet-700",
  "from-cyan-500 via-sky-500 to-blue-600",
];

/** POST /api/instructor/courses — create + publish a course with lessons */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      instructorId,
      title,
      subtitle,
      description,
      category,
      level,
      price,
      language,
      coverGradient,
      lessons,
    } = body ?? {};

    if (!instructorId) return NextResponse.json({ error: "MISSING_INSTRUCTOR" }, { status: 400 });
    if (!title || !String(title).trim()) return NextResponse.json({ error: "TITLE_REQUIRED" }, { status: 400 });

    const instructor = await db.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "NOT_AN_INSTRUCTOR" }, { status: 403 });
    }

    const cleanLessons = Array.isArray(lessons)
      ? lessons
          .map((l: { title?: unknown; durationMinutes?: unknown; videoUrl?: unknown }) => ({
            title: String(l?.title ?? "").trim(),
            durationMinutes: Math.min(180, Math.max(5, Math.round(Number(l?.durationMinutes) || 15))),
            videoUrl: sanitizeVideoUrl(l?.videoUrl),
          }))
          .filter((l: { title: string }) => l.title.length > 0)
      : [];
    if (!cleanLessons.length) return NextResponse.json({ error: "LESSONS_REQUIRED" }, { status: 400 });

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 999) {
      return NextResponse.json({ error: "INVALID_PRICE" }, { status: 400 });
    }

    const durationMinutes = cleanLessons.reduce((s: number, l: { durationMinutes: number }) => s + l.durationMinutes, 0);

    const course = await db.course.create({
      data: {
        title: String(title).trim().slice(0, 200),
        subtitle: String(subtitle ?? "").trim().slice(0, 300) || "New course on LearnHub",
        description:
          String(description ?? "").trim().slice(0, 5000) ||
          `${String(subtitle ?? "").trim() || "A brand-new course"}.\n\nProject-based learning with lifetime access, downloadable resources and a certificate of completion.`,
        category: CATEGORIES.includes(category) ? category : "Development",
        level: LEVELS.includes(level) ? level : "BEGINNER",
        price: Math.round(priceNum * 100) / 100,
        language: language === "中文" ? "中文" : "English",
        coverGradient: GRADIENTS.includes(coverGradient) ? coverGradient : GRADIENTS[0],
        status: "PUBLISHED",
        durationMinutes,
        lessonsCount: cleanLessons.length,
        rating: 0,
        ratingCount: 0,
        studentsCount: 0,
        instructorId,
      },
    });

    let order = 0;
    for (const l of cleanLessons) {
      order++;
      await db.lesson.create({
        data: {
          courseId: course.id,
          title: l.title.slice(0, 200),
          durationMinutes: l.durationMinutes,
          order,
          isPreview: order <= 2,
          videoUrl: l.videoUrl,
        },
      });
    }

    return NextResponse.json({ course });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
