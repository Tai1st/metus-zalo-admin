import type { NextRequest } from "next/server";
import { beAsAdminRaw, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
// IPA tới 100MB: giới hạn thật sự nằm ở experimental.middlewareClientMaxBodySize trong
// next.config.ts (mặc định Next.js chỉ đọc 10MB đầu của Route Handler rồi âm thầm cắt bỏ).
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const qs = req.nextUrl.search;
  const buf = await req.arrayBuffer();
  return withAdmin(req, (token) =>
    beAsAdminRaw(token, `/cert-shop/admin/app/upload${qs}`, buf),
  );
}
