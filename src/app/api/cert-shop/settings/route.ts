import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return withAdmin(req, (token) => beAsAdmin(token, "/cert-shop/admin/settings"));
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, "/cert-shop/admin/settings", { method: "PUT", body }),
  );
}
