import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarColor: user.avatarColor,
        headline: user.headline,
        country: user.country,
      },
    });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
