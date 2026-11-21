import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; action: string }> },
) {
  const { code, action } = await params;
  if (action !== "confirm" && action !== "cancel") {
    return withAdmin(req, async () => {
      throw new Error("Thao tác không hợp lệ");
    });
  }
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/link-orders/${encodeURIComponent(code)}/${action}`, {
      method: "POST",
      body,
    }),
  );
}
