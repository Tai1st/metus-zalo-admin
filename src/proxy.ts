import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getAdminUser } from "@/lib/auth";

const PUBLIC = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  const user = await getAdminUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Chưa đăng nhập" },
      { status: 401 },
    );
  }
  const url = new URL("/login", req.url);
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)$).*)",
  ],
};
