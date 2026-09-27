import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true, headline: true, bio: true, avatarColor: true, country: true } },
      lessons: { orderBy: { order: "asc" } },
    },
  });
  if (!course) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ course });
}
