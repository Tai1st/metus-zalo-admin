import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/plans/${id}`, { method: "PATCH", body }),
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/plans/${id}`, { method: "DELETE" }),
  );
}
