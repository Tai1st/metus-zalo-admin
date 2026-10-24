import type { NextRequest } from "next/server";
import { beAsAdminRaw, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
// IPA tới 100MB: tăng giới hạn body mặc định của Server Actions không áp dụng ở đây
// (đây là Route Handler), nhưng vẫn khai báo rõ để tránh nhầm lẫn khi đọc code.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const qs = req.nextUrl.search;
  const buf = await req.arrayBuffer();
  return withAdmin(req, (token) =>
    beAsAdminRaw(token, `/cert-shop/admin/app/upload${qs}`, buf),
  );
}
