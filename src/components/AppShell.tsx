"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApi } from "@/hooks/useApi";

const NAV = [
  { label: "Tổng quan", href: "/" },
  { label: "Khách hàng", href: "/customers" },
  { label: "Gói cước", href: "/plans" },
  { label: "Gói mua thêm", href: "/addons" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-brand px-5 text-white">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-brand">
            A
          </span>
          <span className="text-base font-semibold">Metus Zalo Admin</span>
        </div>
        <HeaderUser />
      </header>

      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r border-border bg-surface py-3">
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-foreground hover:bg-background"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}

function HeaderUser() {
  const { data } = useApi<{ fullName: string; username: string }>(
    "/api/auth/me",
  );
  const name = data?.fullName || data?.username || "";
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{name}</span>
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="rounded-md bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
      >
        Đăng xuất
      </button>
    </div>
  );
}
