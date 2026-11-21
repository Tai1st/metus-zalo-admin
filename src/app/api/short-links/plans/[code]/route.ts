import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/link-plans/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body,
    }),
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/link-plans/${encodeURIComponent(code)}`, {
      method: "DELETE",
    }),
  );
}
