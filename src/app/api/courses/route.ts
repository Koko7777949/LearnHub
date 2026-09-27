import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim();
  const category = sp.get("category");
  const level = sp.get("level");
  const instructorId = sp.get("instructorId");
  const ids = sp.get("ids");
  const sort = sp.get("sort") || "popular";

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "ALL") where.category = category;
  if (level && level !== "ALL") where.level = level;
  if (instructorId) where.instructorId = instructorId;
  if (ids) {
    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
    if (idList.length) where.id = { in: idList };
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { subtitle: { contains: search } },
      { category: { contains: search } },
      { instructor: { name: { contains: search } } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "rating"
            ? { rating: "desc" }
            : { studentsCount: "desc" };

  const courses = await db.course.findMany({
    where,
    orderBy,
    include: {
      instructor: { select: { id: true, name: true, headline: true, avatarColor: true, country: true } },
    },
  });

  return NextResponse.json({ courses });
}
