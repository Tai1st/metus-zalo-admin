"use client";

import { useState, type SyntheticEvent } from "react";
import { inputCls } from "@/components/ui";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại",
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-lg">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-extrabold text-white">
          A
        </span>
        <h1 className="mt-6 text-xl font-bold">Metus Zalo Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Chỉ tài khoản quản trị mới đăng nhập được vào đây.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Tên đăng nhập
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Mật khẩu</span>
            <span className="relative block">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={`${inputCls} pr-9`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${showPw ? "text-blue-600" : "text-gray-400"}`}
                aria-label="Hiện / ẩn mật khẩu"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </span>
          </label>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <button
            disabled={busy}
            className="h-10 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
