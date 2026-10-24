import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  return withAdmin(req, (token) => beAsAdmin(token, `/cert-shop/admin/orders${qs}`));
}
