import "server-only";
import { NextResponse, type NextRequest } from "next/server";

// Phiên đăng nhập = JWT do metus-zalo-be cấp, lưu trong cookie httpOnly riêng
// của trang admin này (không dùng chung cookie với metus-zalo). Trang này chỉ
// cho role "admin" vào — role "user"/"staff" bị từ chối dù đăng nhập đúng.
export const SESSION_COOKIE = "mza_session";

const CACHE_MS = 30_000;
const STALE_MS = 10 * 60_000;

type Entry = { user: AdminUser | null; at: number };
const g = globalThis as unknown as { __mzaSessions?: Map<string, Entry> };
const cache = (g.__mzaSessions ??= new Map<string, Entry>());

export function backendUrl(): string {
  const base = process.env.BE_URL ?? "http://127.0.0.1:4100";
  return `${base.replace(/\/$/, "")}/api`;
}

export function tokenExpiry(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export type AdminUser = {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "user" | "staff";
};

/**
 * The logged-in admin, or null (no session, expired, or not role "admin").
 * A short cache avoids hitting BE on every request; a stale-but-recent hit
 * survives a brief BE outage instead of logging everyone out.
 */
export async function getAdminUser(
  token: string | undefined,
): Promise<AdminUser | null> {
  if (!token) return null;
  const exp = tokenExpiry(token);
  if (exp === null || exp * 1000 <= Date.now()) return null;

  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.user;

  try {
    const res = await fetch(`${backendUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const u = (await res.json()) as AdminUser;
      const user = u.role === "admin" ? u : null;
      if (cache.size > 500) cache.clear();
      cache.set(token, { user, at: Date.now() });
      return user;
    }
    if (res.status === 401 || res.status === 403) {
      cache.set(token, { user: null, at: Date.now() });
      return null;
    }
  } catch {
    /* BE tạm không phản hồi — dùng lại kết quả gần nhất nếu còn mới */
  }
  return hit && Date.now() - hit.at < STALE_MS ? hit.user : null;
}

export class BeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** Call a BE route as the current admin (forwards their own JWT so `@Roles(Role.Admin)` applies). */
export async function beAsAdmin<T>(
  token: string,
  path: string,
  init?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${backendUrl()}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new BeError("Không kết nối được máy chủ, vui lòng thử lại sau", 502);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new BeError(msg || `Lỗi máy chủ (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/** Shared body for every /api/* route here: require a logged-in admin, then
 * run `handler`, mapping BE errors to the right status code. */
export async function withAdmin<T>(
  req: NextRequest,
  handler: (token: string) => Promise<T>,
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getAdminUser(token);
  if (!user || !token) return fail("Chưa đăng nhập", 401);
  try {
    return ok(await handler(token));
  } catch (e) {
    const status = e instanceof BeError ? e.status : 502;
    return fail((e as Error).message, status);
  }
}
