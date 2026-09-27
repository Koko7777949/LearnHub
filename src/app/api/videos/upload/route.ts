import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * POST /api/videos/upload   (multipart/form-data)
 * Fields: file (video/mp4 | video/webm | video/quicktime), instructorId
 *
 * Instructors (or admins) upload real lesson videos. Files are stored in a
 * writable uploads dir — /tmp on Vercel serverless (ephemeral per lambda, same
 * contract as the demo SQLite DB) and db/uploads locally — and served back
 * through /api/videos/<file> with HTTP Range support.
 *
 * Size cap: 4 MB per file, matching the serverless request-body limit. For
 * production-scale videos you'd swap this for S3/Cloudflare R2 presigned
 * uploads or external hosting (YouTube/Vimeo) — the lesson model accepts any
 * https:// URL as well.
 */

const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export function uploadDir(): string {
  return process.env.VERCEL ? "/tmp/learnhub-uploads" : path.join(process.cwd(), "db", "uploads");
}

export async function POST(req: NextRequest) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "BAD_FORM_DATA" }, { status: 400 });
    }
    const file = form.get("file");
    const instructorId = String(form.get("instructorId") || "");

    if (!instructorId) return NextResponse.json({ error: "MISSING_INSTRUCTOR" }, { status: 400 });
    const uploader = await db.user.findUnique({ where: { id: instructorId } });
    if (!uploader) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (uploader.role !== "INSTRUCTOR" && uploader.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "INVALID_TYPE", accepted: [...ALLOWED_TYPES] }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "TOO_LARGE", maxBytes: MAX_BYTES, hint: "Upload files under 4 MB, or paste an external video URL instead." },
        { status: 413 },
      );
    }

    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });

    const ext = EXT_BY_TYPE[file.type] ?? ".mp4";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);

    return NextResponse.json({
      url: `/api/videos/${filename}`,
      filename,
      bytes: file.size,
      contentType: file.type,
    });
  } catch (err) {
    console.error("[videos/upload]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
