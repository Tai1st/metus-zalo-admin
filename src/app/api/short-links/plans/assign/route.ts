import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// FE gửi POST (apiSend không có PUT); BE yêu cầu PUT /link-plans/assign.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, "/link-plans/assign", { method: "PUT", body }),
  );
}
