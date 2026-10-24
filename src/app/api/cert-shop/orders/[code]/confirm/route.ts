import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/cert-shop/admin/orders/${encodeURIComponent(code)}/confirm`, { method: "POST" }),
  );
}
