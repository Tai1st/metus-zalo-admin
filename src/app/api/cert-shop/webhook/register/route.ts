import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withAdmin(req, (token) =>
    beAsAdmin(token, "/cert-shop/admin/webhook/register", { method: "POST" }),
  );
}
