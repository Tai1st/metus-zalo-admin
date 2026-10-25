import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, "/cert-shop/admin/quick-apps/import-repo", { method: "POST", body }),
  );
}
