import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/admin/leads/${id}/approve`, { method: "POST", body: {} }),
  );
}
