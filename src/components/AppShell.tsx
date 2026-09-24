"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";

const NAV = [
  { label: "Tổng quan", href: "/" },
  { label: "Yêu cầu dùng thử", href: "/leads" },
  { label: "Khách hàng", href: "/customers" },
  { label: "Gói cước", href: "/plans" },
  { label: "Gói mua thêm", href: "/addons" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-brand px-4 text-white sm:px-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="-ml-1 grid h-9 w-9 place-items-center rounded-md hover:bg-white/15 md:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Metus Zalo" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
          <span className="truncate text-base font-semibold">Metus Zalo Admin</span>
        </div>
        <HeaderUser />
      </header>

      <div className="relative flex flex-1">
        {open && (
          <div
            className="fixed inset-0 top-14 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          className={`fixed bottom-0 left-0 top-14 z-40 w-56 shrink-0 overflow-y-auto border-r border-border bg-surface py-3 transition-transform md:static md:z-auto md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
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
                  onClick={() => setOpen(false)}
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
        <main className="min-w-0 flex-1 bg-background p-4 sm:p-6">{children}</main>
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
      <span className="hidden max-w-32 truncate sm:inline">{name}</span>
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
