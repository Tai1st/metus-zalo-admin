import type { NextRequest } from "next/server";
import { beAsAdmin, beAsAdminRaw, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const qs = req.nextUrl.search;
  const buf = await req.arrayBuffer();
  return withAdmin(req, (token) =>
    beAsAdminRaw(token, `/cert-shop/admin/quick-apps/${encodeURIComponent(slug)}${qs}`, buf),
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/cert-shop/admin/quick-apps/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  );
}
