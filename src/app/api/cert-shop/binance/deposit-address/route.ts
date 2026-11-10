import type { NextRequest } from "next/server";
import { beAsAdmin, withAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network") ?? "";
  return withAdmin(req, (token) =>
    beAsAdmin(token, `/cert-shop/admin/binance/deposit-address?network=${encodeURIComponent(network)}`),
  );
}
