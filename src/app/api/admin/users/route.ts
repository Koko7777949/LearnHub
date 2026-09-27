import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { courses: true, enrollments: true } },
    },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarColor: u.avatarColor,
      country: u.country,
      createdAt: u.createdAt.toISOString(),
      courseCount: u._count.courses,
      enrollmentCount: u._count.enrollments,
    })),
  });
}
