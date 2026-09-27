import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/videos/<uuid>.<ext>
 *
 * Streams uploaded lesson videos with full HTTP Range support so <video>
 * playback can seek. Files live in /tmp/learnhub-uploads on Vercel and
 * db/uploads locally (see upload route).
 */

const NAME_RE = /^[a-f0-9-]{8,40}\.(mp4|webm|mov)$/i;
const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function uploadDir(): string {
  return process.env.VERCEL ? "/tmp/learnhub-uploads" : path.join(process.cwd(), "db", "uploads");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!NAME_RE.test(filename)) {
    return NextResponse.json({ error: "BAD_NAME" }, { status: 400 });
  }

  const filePath = path.join(uploadDir(), filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const size = stat.size;

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 1024 * 1024 - 1, size - 1);
      if (Number.isNaN(start) || start >= size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const chunk = fs.readFileSync(filePath).subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  const data = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
