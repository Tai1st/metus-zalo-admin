import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return withAdmin(req, (token) => beAsAdmin(token, "/plans/admin/all"));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, "/plans", { method: "POST", body }),
  );
}
