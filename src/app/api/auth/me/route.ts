import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: user });
}
