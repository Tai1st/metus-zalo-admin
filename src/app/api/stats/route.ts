import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return withAdmin(req, (token) => beAsAdmin(token, "/admin/stats"));
}
