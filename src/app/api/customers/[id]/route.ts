import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAdmin(req, (token) => beAsAdmin(token, `/admin/customers/${id}`));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/admin/customers/${id}`, { method: "PATCH", body }),
  );
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/admin/customers/${id}`, { method: "DELETE" }),
  );
}
